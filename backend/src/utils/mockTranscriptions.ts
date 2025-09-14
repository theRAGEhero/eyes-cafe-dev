import { WorldCafeTranscription, SpeakerSegment } from '@/types';

/**
 * Generate mock transcription data for testing the analysis engine
 * This simulates realistic World Café conversation patterns
 */
export function generateMockTranscriptions(sessionId: string): WorldCafeTranscription[] {
  return [
    {
      id: `transcript_${sessionId}_table_1`,
      session_id: sessionId,
      table_id: 1,
      transcript_text: "Welcome everyone to our discussion about sustainable urban development. I think we should start by sharing our experiences with green initiatives in our cities. I've noticed that community gardens have been really effective in bringing people together while also improving air quality. What has everyone else observed?",
      confidence_score: 0.92,
      word_count: 156,
      language: 'en-US',
      created_at: new Date().toISOString(),
      timestamps: {},
      speaker_segments: [
        {
          speaker: 1,
          transcript: "Welcome everyone to our discussion about sustainable urban development. I think we should start by sharing our experiences with green initiatives in our cities.",
          start: 0.0,
          end: 8.5,
          confidence: 0.95,
          words: [
            { word: "Welcome", start: 0.0, end: 0.8, confidence: 0.98 },
            { word: "everyone", start: 0.9, end: 1.5, confidence: 0.96 },
            { word: "to", start: 1.6, end: 1.8, confidence: 0.99 },
            // ... more words would be here in real data
          ]
        },
        {
          speaker: 2,
          transcript: "I've noticed that community gardens have been really effective in bringing people together while also improving air quality.",
          start: 9.2,
          end: 15.8,
          confidence: 0.88,
          words: []
        },
        {
          speaker: 3,
          transcript: "What has everyone else observed?",
          start: 16.1,
          end: 18.2,
          confidence: 0.91,
          words: []
        },
        {
          speaker: 2,
          transcript: "In my city, we've seen bike-sharing programs really take off. The infrastructure investment was significant but the impact on reducing car dependency has been measurable.",
          start: 18.8,
          end: 28.4,
          confidence: 0.87,
          words: []
        },
        {
          speaker: 4,
          transcript: "Well actually, that doesn't make sense. We tried that in our downtown area but obviously business owners wouldn't support it. Let me explain the real issue here.",
          start: 29.1,
          end: 38.6,
          confidence: 0.89,
          words: []
        },
        {
          speaker: 1,
          transcript: "The resistance issue is really common. I think the key is involving stakeholders from the beginning rather than implementing top-down solutions.",
          start: 39.2,
          end: 47.8,
          confidence: 0.93,
          words: []
        },
        {
          speaker: 3,
          transcript: "Absolutely, community buy-in is essential. We've had success with pilot programs that let people experience the benefits before making permanent changes.",
          start: 48.5,
          end: 57.1,
          confidence: 0.86,
          words: []
        },
        {
          speaker: 2,
          transcript: "Pilot programs are smart. They also help identify unexpected challenges before full rollout. We learned so much from our three-month trial period.",
          start: 57.8,
          end: 66.4,
          confidence: 0.88,
          words: []
        },
        {
          speaker: 4,
          transcript: "I'm curious about funding models. How did you handle the upfront costs? Our city struggles with budget allocation for these kinds of initiatives.",
          start: 67.1,
          end: 75.7,
          confidence: 0.84,
          words: []
        },
        {
          speaker: 1,
          transcript: "More importantly, let's talk about funding models instead. We need to focus on what really matters here - the economic benefits, not just environmental ones.",
          start: 76.3,
          end: 84.9,
          confidence: 0.91,
          words: []
        }
      ]
    },
    {
      id: `transcript_${sessionId}_table_2`,
      session_id: sessionId,
      table_id: 2,
      transcript_text: "Let's explore how technology can support sustainable urban living. Smart city initiatives are becoming more prevalent but we need to ensure they're truly serving the community.",
      confidence_score: 0.89,
      word_count: 142,
      language: 'en-US',
      created_at: new Date().toISOString(),
      timestamps: {},
      speaker_segments: [
        {
          speaker: 5,
          transcript: "Let's explore how technology can support sustainable urban living. Smart city initiatives are becoming more prevalent.",
          start: 0.0,
          end: 7.2,
          confidence: 0.92,
          words: []
        },
        {
          speaker: 6,
          transcript: "But we need to ensure they're truly serving the community, not just collecting data for corporations.",
          start: 7.8,
          end: 14.3,
          confidence: 0.87,
          words: []
        },
        {
          speaker: 7,
          transcript: "That's a crucial point about data privacy. Citizens should have control over how their information is used in smart city systems.",
          start: 15.0,
          end: 22.6,
          confidence: 0.89,
          words: []
        },
        {
          speaker: 5,
          transcript: "Transparency is key. I think cities should publish regular reports on how collected data is being used and what benefits it's providing.",
          start: 23.2,
          end: 31.8,
          confidence: 0.88,
          words: []
        },
        {
          speaker: 8,
          transcript: "We should also consider the digital divide. Smart city solutions need to be accessible to all residents, not just those with the latest devices.",
          start: 32.4,
          end: 40.1,
          confidence: 0.85,
          words: []
        },
        {
          speaker: 6,
          transcript: "Excellent point about accessibility. Universal design principles should apply to digital infrastructure just as much as physical infrastructure.",
          start: 40.7,
          end: 48.9,
          confidence: 0.90,
          words: []
        },
        {
          speaker: 7,
          transcript: "Has anyone worked on projects that successfully bridged the digital divide while implementing smart city features?",
          start: 49.5,
          end: 56.8,
          confidence: 0.86,
          words: []
        },
        {
          speaker: 8,
          transcript: "We partnered with community centers to provide digital literacy training alongside our smart transit system rollout. It made a huge difference in adoption rates.",
          start: 57.4,
          end: 66.2,
          confidence: 0.83,
          words: []
        }
      ]
    }
  ];
}

/**
 * Create mock transcriptions for a session that has active conversation data
 */
export function createMockTranscriptionsForSession(sessionId: string): WorldCafeTranscription[] {
  return generateMockTranscriptions(sessionId);
}