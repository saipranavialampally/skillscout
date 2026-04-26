/**
 * Groq API Integration for Skill Assessment
 * Uses Llama 3 70B for fast, intelligent responses
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// API key from environment variable (set in .env file)
// VITE_GROQ_API_KEY=your_key_here
const apiKey: string | null = (import.meta as any).env?.VITE_GROQ_API_KEY || null;

export function getGroqApiKey(): string | null {
  return apiKey;
}

export function isAIEnabled(): boolean {
  return !!apiKey && apiKey.length > 10;
}

async function callGroq(messages: GroqMessage[], temperature = 0.7): Promise<string> {
  const key = getGroqApiKey();
  if (!key) throw new Error('No API key');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Generate an interview question for a skill
 */
export async function generateQuestionAI(
  skill: string,
  turn: number,
  claimedLevel: number,
  previousMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const systemPrompt = `You are an expert technical interviewer assessing a candidate's ${skill} skills.
The candidate claims ${claimedLevel}/5 proficiency on their resume.

Rules:
- Ask ONE specific, practical question per turn
- Start conceptual, go deeper based on previous answers
- Be conversational but professional
- Don't reveal what score you're giving
- Questions should test real understanding, not memorization
- Keep questions concise (2-3 sentences max)

${turn === 0 ? 'This is the first question. Start with something practical that tests fundamentals.' : ''}
${turn === 1 ? 'Based on their answer, probe deeper on a specific aspect they mentioned or glossed over.' : ''}
${turn === 2 ? 'Final question. Test edge cases or advanced scenarios.' : ''}`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...previousMessages.map(m => ({
      role: m.role === 'agent' ? 'assistant' as const : 'user' as const,
      content: m.content
    })),
    { role: 'user', content: turn === 0 ? 'Please ask your first question.' : 'Ask your next question based on their response.' }
  ];

  return callGroq(messages, 0.8);
}

/**
 * Analyze a candidate's response and score it
 */
export async function analyzeResponseAI(
  skill: string,
  response: string,
  claimedLevel: number,
  turn: number,
  _previousMessages: Array<{ role: string; content: string }>
): Promise<{ score: number; shouldContinue: boolean; confidence: number; rationale: string }> {
  const systemPrompt = `You are evaluating a candidate's ${skill} skills.
The candidate claims ${claimedLevel}/5 proficiency.

Analyze their response and return ONLY valid JSON (no markdown, no explanation):
{
  "score": <1-5>,
  "shouldContinue": <true/false>,
  "confidence": <0-1>,
  "rationale": "<one sentence explanation>"
}

Scoring rubric:
- 5: Expert - deep understanding, specific examples, advanced concepts
- 4: Strong - solid knowledge, good practical understanding
- 3: Intermediate - knows basics, some gaps in deeper knowledge
- 2: Beginner - limited understanding, vague answers
- 1: No knowledge - "I don't know" or completely wrong

Signs of low skill:
- Vague answers without specifics
- "I would google it" as the main strategy
- No technical terminology
- Wrong technical details
- Admitting they don't know

Signs of high skill:
- Specific technical terms
- Concrete examples from experience
- Understanding tradeoffs
- Debugging strategies
- Architecture decisions

Continue asking (shouldContinue: true) if:
- You're not confident in the score yet
- They gave a good answer but you want to verify depth
- Turn < 2

Stop (shouldContinue: false) if:
- You're confident in the score
- They clearly don't know (no point continuing)
- Turn >= 2`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Candidate's response to "${skill}" question:\n\n"${response}"\n\nReturn the JSON assessment.` }
  ];

  const result = await callGroq(messages, 0.3);
  
  // Parse JSON from response
  try {
    // Handle potential markdown wrapping
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(1, Math.min(5, parsed.score || 3)),
        shouldContinue: parsed.shouldContinue ?? (turn < 2),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        rationale: parsed.rationale || 'Scored based on response analysis'
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  // Fallback
  return { score: 3, shouldContinue: turn < 2, confidence: 0.5, rationale: 'Could not analyze response' };
}

/**
 * Generate a final assessment summary
 */
export async function generateSummaryAI(
  skill: string,
  assessedScore: number,
  claimedLevel: number,
  conversationHistory: string
): Promise<string> {
  const systemPrompt = `You are providing a brief assessment summary for ${skill}.
Claimed level: ${claimedLevel}/5
Assessed level: ${assessedScore}/5

Write a 2-3 sentence summary that:
- States the assessed level
- Explains WHY (specific to their answers)
- If they scored low, be honest but constructive
- If they scored high, highlight what was impressive

Be direct and specific. No fluff.`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Here's the conversation:\n\n${conversationHistory}` }
  ];

  return callGroq(messages, 0.5);
}

/**
 * Generate learning plan recommendations
 */
export async function generateLearningPlanAI(
  skills: Array<{ name: string; claimed: number; assessed: number; weight: number }>
): Promise<string> {
  const skillsSummary = skills.map(s => 
    `- ${s.name}: Claimed ${s.claimed}/5, Assessed ${s.assessed}/5, Weight: ${s.weight === 3 ? 'Required' : s.weight === 2 ? 'Preferred' : 'Bonus'}`
  ).join('\n');

  const systemPrompt = `You are a career coach creating a personalized learning plan.
Based on these skill assessments:

${skillsSummary}

Create a concise learning plan in this JSON format:
{
  "readiness_pct": <0-100>,
  "weeks_to_ready": <number>,
  "plan": [
    {
      "skill": "<skill name>",
      "priority": <1-3>,
      "resource": "<specific resource name>",
      "resource_url": "<real URL>",
      "hours_est": <number>,
      "why_first": "<why this skill should be learned first>"
    }
  ]
}

Rules:
- Max 4 plan items
- Prioritize: (gap severity × weight) / learnability
- Learnability is higher for skills adjacent to what they already know
- Include REAL resources (official docs, popular courses)
- Be specific with time estimates`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Generate the learning plan.' }
  ];

  return callGroq(messages, 0.5);
}

/**
 * Check if API key is valid
 */
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Say "hello" in one word.' }],
        max_tokens: 10,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
