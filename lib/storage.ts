import { DEFAULT_SETTINGS } from './types';
import type {
  AppState,
  HistoryEntry,
  Settings,
  StoredLesson,
} from './types';
import { todayKey } from './utils';

const KEYS = {
  settings: 'dl_settings',
  lessons: 'dl_lessons',
  history: 'dl_history',
  pastTitles: 'dl_past_titles',
} as const;

export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.local.get(KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(result[KEYS.settings] as Settings | undefined) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [KEYS.settings]: settings });
}

export async function getLessonByDate(
  date: string,
): Promise<StoredLesson | null> {
  const result = await browser.storage.local.get(KEYS.lessons);
  const lessons = (result[KEYS.lessons] as Record<string, StoredLesson>) ?? {};
  return lessons[date] ?? null;
}

export async function saveLesson(lesson: StoredLesson): Promise<void> {
  const result = await browser.storage.local.get([
    KEYS.lessons,
    KEYS.pastTitles,
  ]);
  const lessons = (result[KEYS.lessons] as Record<string, StoredLesson>) ?? {};
  lessons[lesson.date] = lesson;

  const pastTitles = new Set<string>(
    (result[KEYS.pastTitles] as string[] | undefined) ?? [],
  );
  pastTitles.add(lesson.title);

  await browser.storage.local.set({
    [KEYS.lessons]: lessons,
    [KEYS.pastTitles]: Array.from(pastTitles).slice(-100),
  });
}

export async function getPastTitles(): Promise<string[]> {
  const result = await browser.storage.local.get(KEYS.pastTitles);
  return (result[KEYS.pastTitles] as string[] | undefined) ?? [];
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const result = await browser.storage.local.get(KEYS.history);
  return (result[KEYS.history] as HistoryEntry[] | undefined) ?? [];
}

export async function upsertHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  const idx = history.findIndex((h) => h.date === entry.date);
  if (idx >= 0) history[idx] = entry;
  else history.unshift(entry);
  history.sort((a, b) => b.date.localeCompare(a.date));
  await browser.storage.local.set({ [KEYS.history]: history.slice(0, 90) });
}

export function computeStreak(history: HistoryEntry[]): number {
  const completed = new Set(
    history.filter((h) => h.completed).map((h) => h.date),
  );
  let streak = 0;
  const cursor = new Date();
  // If today isn't completed yet, start from yesterday for ongoing streak display
  if (!completed.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completed.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getAppState(): Promise<AppState> {
  const [settings, todayLesson, history, pastTitles] = await Promise.all([
    getSettings(),
    getLessonByDate(todayKey()),
    getHistory(),
    getPastTitles(),
  ]);
  return {
    settings,
    todayLesson,
    history,
    streak: computeStreak(history),
    pastTitles,
  };
}
