import {
  completeQuiz,
  ensureTodayLesson,
  getGenerationStatus,
  importUrlLesson,
} from '@/lib/lesson';
import { getAppState, getSettings, saveSettings } from '@/lib/storage';
import type { ExtensionMessage, Settings } from '@/lib/types';

const DAILY_ALARM = 'daily-learner-pregen';

export default defineBackground(() => {
  void setupSidePanel();
  void scheduleDailyAlarm();

  browser.runtime.onInstalled.addListener(() => {
    void setupSidePanel();
    void scheduleDailyAlarm();
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== DAILY_ALARM) return;
    void (async () => {
      try {
        const settings = await getSettings();
        if (!settings.apiKey.trim()) return;
        await ensureTodayLesson(false);
      } catch (err) {
        console.warn('[Daily Learner] pre-gen failed', err);
      }
    })();
  });

  browser.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      void handleMessage(message)
        .then(sendResponse)
        .catch((err: unknown) => {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      return true;
    },
  );
});

async function setupSidePanel() {
  try {
    await browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (err) {
    console.warn('[Daily Learner] sidePanel behavior', err);
  }
}

async function scheduleDailyAlarm() {
  const settings = await getSettings();
  const [hours, minutes] = settings.dailyTime.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours || 8, minutes || 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const when = next.getTime();

  await browser.alarms.clear(DAILY_ALARM);
  await browser.alarms.create(DAILY_ALARM, {
    when,
    periodInMinutes: 24 * 60,
  });
}

async function handleMessage(message: ExtensionMessage) {
  switch (message.type) {
    case 'GET_STATE':
      return { ok: true as const, state: await getAppState() };

    case 'SAVE_SETTINGS': {
      const settings: Settings = message.settings;
      await saveSettings(settings);
      await scheduleDailyAlarm();
      return { ok: true as const, state: await getAppState() };
    }

    case 'ENSURE_TODAY_LESSON': {
      const lesson = await ensureTodayLesson(Boolean(message.force));
      return { ok: true as const, lesson };
    }

    case 'COMPLETE_QUIZ': {
      await completeQuiz(message.date, message.answers, message.score);
      return { ok: true as const, state: await getAppState() };
    }

    case 'IMPORT_URL': {
      const lesson = await importUrlLesson(message.url);
      return { ok: true as const, lesson };
    }

    case 'GET_GENERATION_STATUS':
      return { ok: true as const, status: getGenerationStatus() };

    default:
      return { ok: false as const, error: 'Unknown message' };
  }
}
