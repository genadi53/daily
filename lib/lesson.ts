import { runLessonAgent, buildDailyLessonPrompt, buildUrlLessonPrompt } from './cursor';
import { fetchAndExtract } from './extract';
import {
  getLessonByDate,
  getPastTitles,
  getSettings,
  saveLesson,
  upsertHistory,
} from './storage';
import type { GenerationStatus, StoredLesson } from './types';
import { todayKey } from './utils';

let generationStatus: GenerationStatus = { phase: 'idle' };
let inFlight: Promise<StoredLesson> | null = null;

export function getGenerationStatus(): GenerationStatus {
  return generationStatus;
}

function setStatus(status: GenerationStatus) {
  generationStatus = status;
}

export async function ensureTodayLesson(
  force = false,
): Promise<StoredLesson> {
  const date = todayKey();
  if (!force) {
    const cached = await getLessonByDate(date);
    if (cached) return cached;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    const settings = await getSettings();
    if (!settings.apiKey.trim()) {
      setStatus({
        phase: 'error',
        message:
          'Add your Cursor API key in Settings (Dashboard → API Keys) to generate lessons.',
      });
      throw new Error('Missing Cursor API key');
    }

    setStatus({ phase: 'creating', message: 'Creating cloud agent…' });
    const pastTitles = await getPastTitles();

    try {
      const payload = await runLessonAgent(
        settings.apiKey.trim(),
        buildDailyLessonPrompt({
          interests: settings.interests,
          pastTitles,
        }),
        (message) => setStatus({ phase: 'running', message }),
        `Daily Learner ${date}`,
      );

      setStatus({ phase: 'parsing', message: 'Saving today’s lesson…' });
      const lesson: StoredLesson = {
        ...payload,
        date,
        createdAt: new Date().toISOString(),
      };
      await saveLesson(lesson);
      await upsertHistory({
        date,
        title: lesson.title,
        topic: lesson.topic,
        completed: false,
      });
      setStatus({ phase: 'done' });
      return lesson;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Generation failed';
      setStatus({ phase: 'error', message });
      throw err;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function importUrlLesson(url: string): Promise<StoredLesson> {
  const settings = await getSettings();
  if (!settings.apiKey.trim()) {
    setStatus({
      phase: 'error',
      message: 'Add your Cursor API key in Settings before importing a URL.',
    });
    throw new Error('Missing Cursor API key');
  }

  setStatus({ phase: 'creating', message: 'Fetching article…' });
  const extracted = await fetchAndExtract(url);

  setStatus({
    phase: 'running',
    message: 'Generating summary and quiz…',
  });

  try {
    const payload = await runLessonAgent(
      settings.apiKey.trim(),
      buildUrlLessonPrompt({
        url,
        title: extracted.title,
        text: extracted.text,
      }),
      (message) => setStatus({ phase: 'running', message }),
      'Daily Learner URL import',
    );

    const date = `url-${Date.now()}`;
    const lesson: StoredLesson = {
      ...payload,
      date,
      sourceUrl: url,
      createdAt: new Date().toISOString(),
    };
    await saveLesson(lesson);
    await upsertHistory({
      date,
      title: lesson.title,
      topic: lesson.topic,
      completed: false,
      sourceUrl: url,
    });
    setStatus({ phase: 'done' });
    return lesson;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed';
    setStatus({ phase: 'error', message });
    throw err;
  }
}

export async function completeQuiz(
  date: string,
  answers: number[],
  score: number,
): Promise<StoredLesson> {
  const lesson = await getLessonByDate(date);
  if (!lesson) throw new Error('Lesson not found');

  const updated: StoredLesson = {
    ...lesson,
    quizCompleted: true,
    quizScore: score,
    quizAnswers: answers,
  };
  await saveLesson(updated);
  await upsertHistory({
    date,
    title: updated.title,
    topic: updated.topic,
    score,
    completed: true,
    sourceUrl: updated.sourceUrl,
  });
  return updated;
}
