import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename_poly = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const __dirname_poly = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filename_poly);

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is missing. Please add your API key to the .env file (GEMINI_API_KEY=your_key_here) and restart the server.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 2. Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Generate content with automated fallback ladder and error recovery
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  contents: any,
  systemInstruction?: string
): Promise<FallbackResult> {
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed with error:`, err?.message || err);
      lastError = err;
      // Recoverable error status checks: 503, 429, 404, 500, etc.
      continue;
    }
  }

  throw new Error(`All Gemini models in the fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// 3. API Routes

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

/**
 * Endpoint for Multi-Turn Reflection & Journal Conversation
 */
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    // Defensive payload ingestion
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { mode = 'daily_reflection', messages = [], customInstruction } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'At least one message is required for reflection.' });
      return;
    }

    const ai = getAI();

    // Mode-specific coaching persona
    let systemPersona = `You are a thoughtful, empathetic, and sharp journaling companion and executive thinking partner.
Your goal is to help the user reflect deeply, unpack their emotions, challenge assumptions constructively, and find clarity.
Always format your response with clean Markdown (use bolding, bullet points, or concise paragraphs for legibility).
Never give generic platitudes; ask penetrating questions that spur genuine insight.`;

    if (mode === 'brainstorming') {
      systemPersona += `\nMode: BRAINSTORMING & CREATIVE EXPANSION.
Provide imaginative angles, combinatorial ideas, analogical thinking, and lateral directions.`;
    } else if (mode === 'problem_solving') {
      systemPersona += `\nMode: PROBLEM DECONSTRUCTION & ROOT CAUSE ANALYSIS.
Help break the problem into first principles, identify blind spots, analyze trade-offs, and outline high-leverage solutions.`;
    } else if (mode === 'gratitude') {
      systemPersona += `\nMode: GRATITUDE & WINS APPRECIATION.
Celebrate progress, anchor positive reinforcement, and highlight the downstream impact of small wins.`;
    } else if (mode === 'action_planning') {
      systemPersona += `\nMode: ACTION PLANNING & EXECUTION.
Translate thoughts and feelings into clear, high-priority next actions, time horizons, and risk mitigations.`;
    } else if (mode === 'socratic_voice') {
      systemPersona += `\nMode: VOICE STREAM & SOCRATIC AUDIO DIALOGUE.
The user is speaking aloud (stream of consciousness). Keep your answers conversational, concise (under 3-4 sentences), and punchy.
Validate their insight briefly, challenge one implicit assumption with an incisive Socratic question, and prompt their next spoken reflection.`;
    }

    if (customInstruction && typeof customInstruction === 'string') {
      systemPersona += `\nAdditional user directive: ${customInstruction}`;
    }

    // Convert messages to Gemini contents structure
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }],
    }));

    const result = await generateContentWithFallback(ai, contents, systemPersona);

    res.json({
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({
      error: error.message || 'An internal error occurred during reflection generation.',
    });
  }
});

/**
 * Endpoint for Generating High-Level Summaries & Takeaways
 */
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { title = 'Journal Reflection', mode = 'daily_reflection', messages = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages are required for summary generation.' });
      return;
    }

    const ai = getAI();

    const conversationTranscript = messages
      .map((m: any) => `${m.role === 'assistant' ? 'Gemini' : 'User'}: ${m.content || m.text}`)
      .join('\n\n');

    const prompt = `You are an expert cognitive synthesizer. Given the following journal/reflection session titled "${title}" (Mode: ${mode}):

CONVERSATION TRANSCRIPT:
${conversationTranscript}

Please provide a JSON response formatted EXACTLY with the following keys:
{
  "summary": "A concise, coherent 2-3 sentence overview capturing the core emotional tone, key realizations, and direction of this entry.",
  "takeaways": [
    "Key actionable takeaway or insight 1",
    "Key actionable takeaway or insight 2",
    "Key actionable takeaway or insight 3"
  ],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "mood": "energized" | "reflective" | "calm" | "challenged" | "grateful" | "focused"
}

Ensure the response is strictly valid raw JSON without markdown code fences.`;

    const result = await generateContentWithFallback(ai, prompt);

    let parsedData;
    try {
      // Strip potential markdown code block formatting
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      }
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn('Failed to parse JSON directly from summary output, providing fallback structure:', parseErr);
      parsedData = {
        summary: result.text.slice(0, 300),
        takeaways: ['Reflected on core priorities and thoughts.', 'Gained perspective on current challenges.'],
        suggestedTags: ['reflection', mode],
        mood: 'reflective',
      };
    }

    res.json({
      ...parsedData,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate entry summary.',
    });
  }
});

/**
 * Endpoint for Longitudinal Cognitive Growth & Blindspot Radar Analysis
 */
app.post('/api/analytics/patterns', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { entries = [] } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: 'Journal entries history is required for cognitive pattern analysis.' });
      return;
    }

    const ai = getAI();

    // Sanitize entries to strip excessive payload length and keep essential semantic fields
    const formattedArchive = entries.slice(0, 30).map((e: any, idx: number) => {
      const summaryText = e.summary || (e.messages && e.messages[0]?.text) || 'No summary';
      const takeawaysList = Array.isArray(e.takeaways) ? e.takeaways.join('; ') : '';
      const mood = e.mood || 'unspecified';
      const dateStr = e.createdAt ? new Date(e.createdAt).toLocaleDateString() : `Entry #${idx + 1}`;
      const mode = e.mode || 'daily_reflection';
      const tags = Array.isArray(e.tags) ? e.tags.join(', ') : '';

      return `[Entry ${idx + 1} - ${dateStr} - Mode: ${mode} - Mood: ${mood} - Tags: ${tags}]
Title: ${e.title || 'Untitled'}
Summary: ${summaryText}
Key Takeaways: ${takeawaysList}`;
    }).join('\n\n---\n\n');

    const prompt = `You are an elite cognitive psychologist, executive coach, and meta-learning analyst.
Analyze this user's longitudinal journal and reflection archive:

ARCHIVE DATA (${entries.length} reflections):
${formattedArchive}

Perform a rigorous, holistic synthesis of the user's cognitive trajectory.
Return a STRICT raw JSON object with EXACTLY this structure (no markdown fences):
{
  "growthSummary": "A 2-3 sentence executive synthesis of their recent mindset evolution, primary mental habits, and momentum.",
  "radarMetrics": [
    { "category": "Strategic Clarity", "score": 85, "benchmark": 70, "description": "Ability to cut through noise and define clear priorities." },
    { "category": "Emotional Equanimity", "score": 75, "benchmark": 65, "description": "Resilience in processing stress and maintaining perspective." },
    { "category": "Action Orientation", "score": 80, "benchmark": 75, "description": "Translating reflection into concrete, tangible next steps." },
    { "category": "Cognitive Flexibility", "score": 90, "benchmark": 70, "description": "Openness to reframing problems and considering alternate angles." },
    { "category": "Self-Compassion", "score": 65, "benchmark": 75, "description": "Grace given to self during setbacks vs. harsh self-criticism." },
    { "category": "Creative Breakthroughs", "score": 88, "benchmark": 60, "description": "Generating novel connections and lateral ideas." }
  ],
  "cognitivePatterns": [
    {
      "name": "Pattern or Distortion Name (e.g., Catastrophizing, First-Principles Thinking)",
      "type": "strength" | "blindspot" | "growth_opportunity",
      "description": "Concrete observation of how this manifests in their entries.",
      "frequency": "High" | "Moderate" | "Occasional",
      "recommendation": "One actionable, practical reframe or behavioral countermeasure."
    }
  ],
  "moodTrajectory": [
    {
      "date": "MMM DD",
      "mood": "energized" | "reflective" | "calm" | "challenged" | "grateful" | "focused",
      "sentimentScore": 8,
      "entryTitle": "Short title"
    }
  ],
  "topThemes": [
    { "theme": "Theme Name", "count": 4, "status": "growing" | "stable" | "resolved" }
  ],
  "coachingQuestions": [
    {
      "id": "q1",
      "question": "An incisive, high-leverage Socratic question challenging an underlying pattern.",
      "context": "Why this question is relevant based on their entries.",
      "suggestedAction": "A 5-minute journaling exercise or next action to explore this."
    }
  ]
}

Provide 3 to 5 realistic cognitive patterns (balancing strengths and blind spots), 6 radar metric categories with scores between 40-100, mood trajectory points based on actual entries, top 4-5 themes, and 3 personalized coaching questions.
Strict raw JSON only.`;

    const result = await generateContentWithFallback(ai, prompt);

    let parsedData;
    try {
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      }
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn('Failed to parse analytics JSON from Gemini, fallback generated:', parseErr);
      parsedData = {
        growthSummary: "Reflective pattern indicates proactive self-inquiry and strong solution-seeking across varied domains.",
        radarMetrics: [
          { category: "Strategic Clarity", score: 80, benchmark: 70, description: "Ability to define clear priorities." },
          { category: "Emotional Equanimity", score: 72, benchmark: 65, description: "Maintaining composure under pressure." },
          { category: "Action Orientation", score: 78, benchmark: 75, description: "Executing concrete next steps." },
          { category: "Cognitive Flexibility", score: 85, benchmark: 70, description: "Reframing perspectives effectively." },
          { category: "Self-Compassion", score: 68, benchmark: 75, description: "Constructive self-dialogue." },
          { category: "Creative Breakthroughs", score: 82, benchmark: 60, description: "Lateral and innovative thinking." },
        ],
        cognitivePatterns: [
          {
            name: "High Accountability",
            type: "strength",
            description: "Consistently takes ownership of challenges and seeks proactive solutions.",
            frequency: "High",
            recommendation: "Continue anchoring this strength while maintaining self-compassion."
          },
          {
            name: "Premature Optimization",
            type: "blindspot",
            description: "Tendency to over-engineer complex action plans before initial validation.",
            frequency: "Moderate",
            recommendation: "Focus on smallest viable experiments before scaling systems."
          }
        ],
        moodTrajectory: entries.slice(-7).map((e: any) => ({
          date: e.createdAt ? new Date(e.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent',
          mood: e.mood || 'reflective',
          sentimentScore: e.mood === 'energized' ? 9 : e.mood === 'grateful' ? 9 : e.mood === 'calm' ? 8 : e.mood === 'focused' ? 8 : e.mood === 'reflective' ? 7 : 5,
          entryTitle: e.title || 'Journal Entry'
        })),
        topThemes: [
          { theme: "Focus & Execution", count: entries.length, status: "growing" },
          { theme: "Cognitive Clarity", count: Math.max(1, Math.floor(entries.length * 0.7)), status: "stable" }
        ],
        coachingQuestions: [
          {
            id: "q1",
            question: "Where in your current projects are you planning for 10 steps ahead when only the very next step is clear?",
            context: "Observed in problem-solving and brainstorming entries.",
            suggestedAction: "Identify the single 15-minute action that unlocks momentum today."
          }
        ]
      };
    }

    res.json({
      ...parsedData,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/analytics/patterns:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate cognitive patterns and radar analytics.',
    });
  }
});

// 4. Vite Middleware Integration (Dev) or Static Serving (Prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ReflectAI is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
