export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonPayload {
  title: string;
  topic: string;
  articleMarkdown: string;
  sources: string[];
  quiz: QuizQuestion[];
}

export interface StoredLesson extends LessonPayload {
  date: string;
  sourceUrl?: string;
  createdAt: string;
  quizCompleted?: boolean;
  quizScore?: number;
  quizAnswers?: number[];
}

export interface Settings {
  apiKey: string;
  interests: string[];
  notificationsEnabled: boolean;
  dailyTime: string; // "HH:MM" local
}

export interface HistoryEntry {
  date: string;
  title: string;
  topic: string;
  score?: number;
  completed: boolean;
  sourceUrl?: string;
}

export interface AppState {
  settings: Settings;
  todayLesson: StoredLesson | null;
  history: HistoryEntry[];
  streak: number;
  pastTitles: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  interests: ['science', 'history', 'technology'],
  notificationsEnabled: true,
  dailyTime: '08:00',
};

export type GenerationStatus =
  | { phase: 'idle' }
  | { phase: 'creating'; message: string }
  | { phase: 'running'; message: string }
  | { phase: 'parsing'; message: string }
  | { phase: 'error'; message: string }
  | { phase: 'done' };

export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'SAVE_SETTINGS'; settings: Settings }
  | { type: 'ENSURE_TODAY_LESSON'; force?: boolean }
  | { type: 'COMPLETE_QUIZ'; date: string; answers: number[]; score: number }
  | { type: 'IMPORT_URL'; url: string }
  | { type: 'GET_GENERATION_STATUS' };

export type ExtensionResponse =
  | { ok: true; state: AppState }
  | { ok: true; lesson: StoredLesson }
  | { ok: true; status: GenerationStatus }
  | { ok: false; error: string };
