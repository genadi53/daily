import type {
  AppState,
  ExtensionMessage,
  ExtensionResponse,
  Settings,
  StoredLesson,
  GenerationStatus,
} from './types';

async function send<T extends ExtensionResponse>(
  message: ExtensionMessage,
): Promise<T> {
  const response = (await browser.runtime.sendMessage(message)) as T;
  return response;
}

export async function fetchState(): Promise<AppState> {
  const res = await send<{ ok: true; state: AppState } | { ok: false; error: string }>({
    type: 'GET_STATE',
  });
  if (!res.ok) throw new Error(res.error);
  return res.state;
}

export async function saveSettings(settings: Settings): Promise<AppState> {
  const res = await send<{ ok: true; state: AppState } | { ok: false; error: string }>({
    type: 'SAVE_SETTINGS',
    settings,
  });
  if (!res.ok) throw new Error(res.error);
  return res.state;
}

export async function ensureTodayLesson(
  force = false,
): Promise<StoredLesson> {
  const res = await send<
    { ok: true; lesson: StoredLesson } | { ok: false; error: string }
  >({
    type: 'ENSURE_TODAY_LESSON',
    force,
  });
  if (!res.ok) throw new Error(res.error);
  return res.lesson;
}

export async function completeQuiz(
  date: string,
  answers: number[],
  score: number,
): Promise<AppState> {
  const res = await send<{ ok: true; state: AppState } | { ok: false; error: string }>({
    type: 'COMPLETE_QUIZ',
    date,
    answers,
    score,
  });
  if (!res.ok) throw new Error(res.error);
  return res.state;
}

export async function importUrl(url: string): Promise<StoredLesson> {
  const res = await send<
    { ok: true; lesson: StoredLesson } | { ok: false; error: string }
  >({
    type: 'IMPORT_URL',
    url,
  });
  if (!res.ok) throw new Error(res.error);
  return res.lesson;
}

export async function fetchGenerationStatus(): Promise<GenerationStatus> {
  const res = await send<
    { ok: true; status: GenerationStatus } | { ok: false; error: string }
  >({
    type: 'GET_GENERATION_STATUS',
  });
  if (!res.ok) throw new Error(res.error);
  return res.status;
}
