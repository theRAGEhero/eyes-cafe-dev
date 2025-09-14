import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';

export interface AnalysisPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  systemPrompt: string;
  category: 'understanding' | 'patterns' | 'dynamics' | 'insights';
  order: number;
  enabled: boolean;
  estimatedTime: string;
}

export interface AnalysisStep {
  id: string;
  promptId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  reasoning: string[];
  output: string;
  confidence: number;
  processingTime?: number;
  error?: string;
}

export interface AnalysisRequest {
  sessionId: string;
  transcription: string;
  prompts: AnalysisPrompt[];
}

export interface AnalysisResponse {
  sessionId: string;
  steps: AnalysisStep[];
  totalProcessingTime: number;
  overallConfidence: number;
  completedAt: string;
}

/**
 * Conversation Analysis Service using chain-of-thought reasoning
 */
export class ConversationAnalysisService {

  /**
   * Run chain-of-thought analysis on a conversation transcript
   */
  async runAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = Date.now();
    
    logger.info(`Starting chain-of-thought analysis for session ${request.sessionId}`);

    const enabledPrompts = request.prompts
      .filter(p => p.enabled)
      .sort((a, b) => a.order - b.order);

    const steps: AnalysisStep[] = enabledPrompts.map(prompt => ({
      id: prompt.id,
      promptId: prompt.id,
      name: prompt.name,
      status: 'pending',
      reasoning: [],
      output: '',
      confidence: 0
    }));

    // Process each step sequentially with chain-of-thought
    let previousContext = '';
    const confidenceScores: number[] = [];

    for (let i = 0; i < enabledPrompts.length; i++) {
      const prompt = enabledPrompts[i];
      const step = steps[i];
      
      logger.info(`Processing analysis step: ${step.name}`);
      step.status = 'running';

      try {
        const stepStartTime = Date.now();

        // Build context from previous steps for chain-of-thought
        const contextualPrompt = previousContext 
          ? `${prompt.prompt}\n\n**Context from previous analysis steps:**\n${previousContext}\n\n**Transcript to analyze:**\n${request.transcription}`
          : `${prompt.prompt}\n\n**Transcript to analyze:**\n${request.transcription}`;

        // Call Groq API for this analysis step
        const response = await this.callGroqAPI(prompt.systemPrompt, contextualPrompt);

        const processingTime = Date.now() - stepStartTime;

        // Update step with results
        step.status = 'completed';
        step.reasoning = response.reasoning;
        step.output = response.output;
        step.confidence = response.confidence;
        step.processingTime = processingTime;

        confidenceScores.push(response.confidence);

        // Add to context for next steps (chain-of-thought)
        previousContext += `\n\n**${prompt.name}:**\n${response.output}`;

        logger.info(`Completed analysis step: ${step.name} (${processingTime}ms)`);

      } catch (error) {
        logger.error(`Error in analysis step ${step.name}:`, error);
        step.status = 'error';
        step.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const overallConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;

    const analysisResponse: AnalysisResponse = {
      sessionId: request.sessionId,
      steps,
      totalProcessingTime,
      overallConfidence,
      completedAt: new Date().toISOString()
    };

    // Store analysis results in database
    await this.storeAnalysisResults(analysisResponse);

    logger.info(`Completed chain-of-thought analysis for session ${request.sessionId} in ${totalProcessingTime}ms`);

    return analysisResponse;
  }

  /**
   * Call Groq API for a single analysis step
   */
  private async callGroqAPI(systemPrompt: string, userPrompt: string) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b', // Same model as chatbot
        messages: [
          { 
            role: 'system', 
            content: `${systemPrompt}\n\nIMPORTANT: Structure your response as JSON with this format:
{
  "reasoning": ["step 1 of thinking", "step 2 of thinking", "step 3 of thinking"],
  "output": "main analysis result here",
  "confidence": 0.85
}

Keep responses concise and actionable. Focus on what facilitators need to know.`
          },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent analysis
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        reasoning: parsed.reasoning || ['Analysis completed'],
        output: parsed.output || content,
        confidence: parsed.confidence || 0.8
      };
    } catch (parseError) {
      // If not JSON, treat as plain text with default structure
      return {
        reasoning: ['Processing conversation transcript and generating insights'],
        output: content,
        confidence: 0.75
      };
    }
  }

  /**
   * Store analysis results in database
   */
  private async storeAnalysisResults(analysis: AnalysisResponse): Promise<void> {
    try {
      // Get the session from database
      const session = await prisma.session.findFirst({
        where: { worldCafeId: analysis.sessionId }
      });

      if (!session) {
        logger.warn(`Session ${analysis.sessionId} not found in database`);
        return;
      }

      // Store in AI Analysis table
      await prisma.aiAnalysis.create({
        data: {
          sessionId: session.id,
          analysisTimestamp: new Date(analysis.completedAt),
          processingTimeMs: analysis.totalProcessingTime,
          conversationFlow: {
            steps: analysis.steps.map(step => ({
              name: step.name,
              status: step.status,
              reasoning: step.reasoning,
              output: step.output,
              confidence: step.confidence,
              processingTime: step.processingTime,
              error: step.error
            }))
          },
          confidenceScores: {
            overall: analysis.overallConfidence,
            steps: analysis.steps.map(s => s.confidence)
          },
          modelVersions: {
            llm: 'openai/gpt-oss-120b',
            analysisService: '1.0'
          }
        }
      });

      logger.info(`Stored analysis results for session ${analysis.sessionId} in database`);
    } catch (error) {
      logger.error(`Failed to store analysis results:`, error);
    }
  }

  /**
   * Get default analysis prompts
   */
  getDefaultPrompts(): AnalysisPrompt[] {
    return [
      {
        id: '1',
        name: 'Context Understanding',
        description: 'First, understand the conversation structure and participants',
        category: 'understanding',
        order: 1,
        enabled: true,
        estimatedTime: '30-45s',
        systemPrompt: `You are an expert conversation analyst specializing in World Café dialogue patterns. Your task is to understand the basic structure and context of this conversation before deeper analysis.`,
        prompt: `Please analyze this World Café conversation transcript and provide:

1. **Conversation Structure Analysis**
   - How many distinct speakers/voices can you identify?
   - What appears to be the main topic or question being discussed?
   - Can you identify any clear phases or shifts in the conversation?

2. **Participant Dynamics (Initial Assessment)**
   - Who seems to be most/least active in terms of contribution frequency?
   - Are there any clear roles emerging (questioner, synthesizer, storyteller, etc.)?

3. **Conversation Quality Indicators**
   - Do people seem to be listening and building on each other's ideas?
   - Is there evidence of genuine curiosity vs. debate/argument?
   - How would you characterize the overall tone and energy?

**Think step by step and explain your reasoning for each observation.**`
      },
      {
        id: '2',
        name: 'Speaking Pattern Analysis',
        description: 'Analyze turn-taking, interruptions, and participation balance',
        category: 'patterns',
        order: 2,
        enabled: true,
        estimatedTime: '45-60s',
        systemPrompt: `You are analyzing speaking patterns to understand participation dynamics. Focus on facilitation-relevant insights, not individual judgment.`,
        prompt: `Based on the conversation transcript, analyze the speaking patterns:

1. **Turn-Taking Patterns**
   - How do speakers transition between each other? (Natural flow, interruptions, facilitated turns?)
   - Are there patterns in who speaks after whom?
   - Do people build on previous speakers or introduce new topics?

2. **Participation Balance Assessment**
   - Which voices are contributing most/least to the conversation?
   - Are there long periods where certain people don't speak?
   - What might explain these patterns? (Topic relevance, comfort level, conversation style?)

3. **Conversational Behaviors**
   - Evidence of active listening (references to previous speakers, building on ideas)?
   - Interruption patterns - are they collaborative or competitive?
   - Who asks questions vs. makes statements?

4. **Facilitation Insights**
   - What would help create more inclusive participation?
   - Are there natural conversation leaders who could help draw others in?
   - What patterns would you want the facilitator to know about?

**For each observation, explain your reasoning and suggest what a facilitator might do with this information.**`
      },
      {
        id: '3',
        name: 'Group Dynamics Analysis',
        description: 'Identify psychological safety, trust, and collective intelligence patterns',
        category: 'dynamics',
        order: 3,
        enabled: true,
        estimatedTime: '60-90s',
        systemPrompt: `You are analyzing group dynamics and psychological safety. Focus on systemic patterns that affect conversation quality, not individual pathology.`,
        prompt: `Analyze the group dynamics and relational patterns in this conversation:

1. **Psychological Safety Assessment**
   - Do people seem comfortable sharing personal experiences or uncertainties?
   - Is there evidence of people holding back or self-censoring?
   - How do people respond when someone shares something vulnerable or different?

2. **Trust and Connection Patterns**
   - What evidence do you see of trust building between participants?
   - Do people refer to each other's contributions respectfully?
   - Are there signs of genuine curiosity about different perspectives?

3. **Collective Intelligence Indicators**
   - Does the group build ideas together or just share individual thoughts?
   - Do new insights emerge that no single person brought to the conversation?
   - How does the group handle complexity and uncertainty?

4. **Cultural and Communication Patterns**
   - Are there different communication styles present (direct/indirect, analytical/narrative, etc.)?
   - How does the group navigate cultural or perspective differences?
   - What conversation norms seem to be operating?

**Focus on patterns that would help a facilitator understand the group's capacity for deeper dialogue.**`
      },
      {
        id: '4',
        name: 'Facilitator Insights',
        description: 'Synthesize observations into actionable facilitator guidance',
        category: 'insights',
        order: 4,
        enabled: true,
        estimatedTime: '45-75s',
        systemPrompt: `You are synthesizing your analysis into practical, supportive insights for facilitators. Focus on strengths to build on and gentle growth edges to explore.`,
        prompt: `Based on your analysis of the conversation structure, speaking patterns, and group dynamics, synthesize insights for the facilitator:

1. **What's Working Well (Strengths to Celebrate)**
   - What conversation patterns are supporting good dialogue?
   - Which participant behaviors are helping the group learn together?
   - What evidence do you see of the group's conversation capacity?

2. **Growth Edges (Opportunities, Not Problems)**
   - What would help this group go deeper in their dialogue?
   - What conversation patterns could be gently strengthened?
   - Where might the group be ready for more challenge or complexity?

3. **Facilitator Recommendations**
   - What should the facilitator keep doing that's working?
   - What gentle interventions might support better inclusion or depth?
   - How could the facilitator build on the group's natural strengths?

4. **Next Conversation Suggestions**
   - Based on this group's development, what would serve them next time?
   - What conversation formats or topics might they be ready for?
   - How could they build on the insights that emerged here?

**Frame everything as opportunities for growth and connection, not deficits to fix. The goal is to help the facilitator support the group's natural wisdom and capacity for meaningful dialogue.**`
      }
    ];
  }
}

// Export singleton instance
export const conversationAnalysisService = new ConversationAnalysisService();