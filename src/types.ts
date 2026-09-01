export type ReflectionMode = 
  | 'daily_reflection' 
  | 'brainstorming' 
  | 'problem_solving' 
  | 'gratitude' 
  | 'action_planning'
  | 'socratic_voice';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  model?: string;
  isSpokenVoice?: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  initialPrompt: string;
  messages: ChatMessage[];
  summary?: string;
  takeaways?: string[];
  tags: string[];
  mood?: 'energized' | 'reflective' | 'calm' | 'challenged' | 'grateful' | 'focused';
  createdAt: number;
  updatedAt: number;
}

export interface InteractionRecord {
  id: string;
  userId: string;
  entryId: string;
  prompt: string;
  response: string;
  mode: ReflectionMode;
  modelUsed: string;
  timestamp: number;
}

export interface ReflectionRequestPayload {
  mode: ReflectionMode;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  customInstruction?: string;
}

export interface SummarizeRequestPayload {
  title: string;
  mode: ReflectionMode;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface RadarMetric {
  category: string;
  score: number;
  benchmark: number;
  description: string;
}

export interface CognitivePattern {
  name: string;
  type: 'strength' | 'blindspot' | 'growth_opportunity';
  description: string;
  frequency: 'High' | 'Moderate' | 'Occasional';
  recommendation: string;
}

export interface MoodTrendPoint {
  date: string;
  mood: 'energized' | 'reflective' | 'calm' | 'challenged' | 'grateful' | 'focused' | string;
  sentimentScore: number;
  entryTitle: string;
}

export interface ThemeFocus {
  theme: string;
  count: number;
  status: 'growing' | 'stable' | 'resolved';
}

export interface CoachingQuestion {
  id: string;
  question: string;
  context: string;
  suggestedAction: string;
}

export interface CognitiveAnalyticsReport {
  growthSummary: string;
  radarMetrics: RadarMetric[];
  cognitivePatterns: CognitivePattern[];
  moodTrajectory: MoodTrendPoint[];
  topThemes: ThemeFocus[];
  coachingQuestions: CoachingQuestion[];
  modelUsed?: string;
  generatedAt?: number;
}

