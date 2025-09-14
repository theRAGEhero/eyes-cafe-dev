'use client';

import { useState, useEffect } from 'react';
import { 
  Brain,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb,
  Users,
  MessageSquare
} from 'lucide-react';

interface AnalysisPrompt {
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

interface AnalysisStep {
  id: string;
  promptId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  reasoning: string[];
  output: string;
  confidence: number;
  processingTime?: number;
}

interface AIAnalysisPanelProps {
  sessionId: string;
  transcription: string;
  onAnalysisComplete: (results: any) => void;
  onAnalysisStart?: () => void;
}

export function AIAnalysisPanel({ 
  sessionId, 
  transcription, 
  onAnalysisComplete, 
  onAnalysisStart 
}: AIAnalysisPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);

  // Chain-of-thought prompts for conversation analysis
  const [prompts, setPrompts] = useState<AnalysisPrompt[]>([
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

**Think step by step and explain your reasoning for each observation.**

Transcript:
{transcription}`
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
      name: 'Conversational Dynamics',
      description: 'Identify power dynamics, psychological safety, and group development',
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

2. **Power and Influence Patterns**
   - Who has the most influence on conversation direction?
   - Are certain types of knowledge/experience valued over others?
   - Do people defer to anyone in particular? Why might that be?

3. **Conflict and Disagreement Handling**
   - How does the group handle different perspectives or disagreement?
   - Do people avoid conflict or engage with it productively?
   - Is there evidence of healthy debate vs. defensiveness?

4. **Group Development Stage**
   - Does this seem like a new group still forming or an established group?
   - What evidence do you see of trust and comfort between participants?
   - Are people taking risks in their sharing and thinking?

5. **Cultural and Communication Patterns**
   - Are there different communication styles present (direct/indirect, analytical/narrative, etc.)?
   - How does the group navigate cultural or perspective differences?
   - What conversation norms seem to be operating?

**Focus on patterns that would help a facilitator understand the group's capacity for deeper dialogue.**`
    },
    {
      id: '4',
      name: 'Insight Generation',
      description: 'Synthesize observations into actionable facilitator insights',
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

5. **Pattern Recognition**
   - What conversation patterns from your knowledge base does this group exhibit?
   - What successful facilitation techniques would work well with this group's style?
   - Are there any cultural or contextual factors the facilitator should consider?

**Frame everything as opportunities for growth and connection, not deficits to fix. The goal is to help the facilitator support the group's natural wisdom and capacity for meaningful dialogue.**`
    }
  ]);

  const runAnalysis = async () => {
    if (!transcription.trim()) {
      alert('No transcription available to analyze.');
      return;
    }

    setIsRunning(true);
    setCurrentStep(null);
    setAnalysisSteps([]);
    onAnalysisStart?.();

    const enabledPrompts = prompts.filter(p => p.enabled).sort((a, b) => a.order - b.order);
    
    // Initialize steps for UI
    const steps: AnalysisStep[] = enabledPrompts.map(prompt => ({
      id: prompt.id,
      promptId: prompt.id,
      name: prompt.name,
      status: 'pending',
      reasoning: [],
      output: '',
      confidence: 0
    }));

    setAnalysisSteps(steps);

    try {
      // Make real API call to backend
      const analysisRequest = {
        sessionId,
        transcription,
        prompts: enabledPrompts
      };

      const response = await fetch('http://localhost:3002/api/conversation-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      const analysisResult = data.data;

      // Update UI with real results from API
      setAnalysisSteps(analysisResult.steps.map((step: any) => ({
        id: step.id,
        promptId: step.promptId,
        name: step.name,
        status: step.status,
        reasoning: step.reasoning,
        output: step.output,
        confidence: step.confidence,
        processingTime: step.processingTime,
        error: step.error
      })));

      // Return results to parent component
      onAnalysisComplete(analysisResult);

    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Mark all steps as error
      setAnalysisSteps(prev => prev.map(s => ({
        ...s,
        status: 'error',
        output: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })));

      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCurrentStep(null);
      setIsRunning(false);
    }
  };


  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'running': return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'understanding': return 'text-blue-600 bg-blue-100';
      case 'patterns': return 'text-green-600 bg-green-100';
      case 'dynamics': return 'text-purple-600 bg-purple-100';
      case 'insights': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Analysis Engine</h2>
              <p className="text-sm text-gray-600">Chain-of-thought conversation analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className={`p-2 rounded-md transition-colors ${
                showPrompts ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="View/Edit Prompts"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={runAnalysis}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Configuration Panel */}
      {showPrompts && (
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Chain Configuration</h3>
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={prompt.enabled}
                      onChange={(e) => setPrompts(prev => prev.map(p => 
                        p.id === prompt.id ? { ...p, enabled: e.target.checked } : p
                      ))}
                      className="rounded"
                    />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(prompt.category)}`}>
                      {prompt.category}
                    </span>
                    <span className="font-medium text-gray-900">{prompt.name}</span>
                    <span className="text-xs text-gray-500">{prompt.estimatedTime}</span>
                  </div>
                  <button
                    onClick={() => setEditingPrompt(editingPrompt === prompt.id ? null : prompt.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                
                {editingPrompt === prompt.id && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">System Prompt</label>
                      <textarea
                        value={prompt.systemPrompt}
                        onChange={(e) => setPrompts(prev => prev.map(p => 
                          p.id === prompt.id ? { ...p, systemPrompt: e.target.value } : p
                        ))}
                        className="w-full h-20 text-xs border rounded-md p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Analysis Prompt</label>
                      <textarea
                        value={prompt.prompt}
                        onChange={(e) => setPrompts(prev => prev.map(p => 
                          p.id === prompt.id ? { ...p, prompt: e.target.value } : p
                        ))}
                        className="w-full h-32 text-xs border rounded-md p-2 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Steps */}
      <div className="p-6">
        {analysisSteps.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
            <p className="text-gray-600 mb-4">
              Click "Run Analysis" to start the chain-of-thought conversation analysis.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                The AI will analyze the conversation in {prompts.filter(p => p.enabled).length} sequential steps,
                showing its reasoning process transparently.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {analysisSteps.map((step, index) => (
              <div key={step.id} className="border rounded-lg overflow-hidden">
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    currentStep === step.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStepIcon(step.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            Step {index + 1}: {step.name}
                          </span>
                          {step.confidence > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {Math.round(step.confidence * 100)}% confident
                            </span>
                          )}
                          {step.processingTime && (
                            <span className="text-xs text-gray-500">
                              {(step.processingTime / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedStep === step.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedStep === step.id && step.status !== 'pending' && (
                  <div className="border-t bg-white p-4">
                    {step.reasoning.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          <span>Chain of Thought</span>
                        </h4>
                        <ul className="space-y-1">
                          {step.reasoning.map((thought, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{thought}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.output && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span>Analysis Output</span>
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                            {step.output}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}