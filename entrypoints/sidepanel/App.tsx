import { useCallback, useEffect, useState } from 'react';
import { ArticleReader } from '@/components/ArticleReader';
import { GeneratingState } from '@/components/GeneratingState';
import { HistoryList } from '@/components/HistoryList';
import { Quiz } from '@/components/Quiz';
import { SettingsPanel } from '@/components/SettingsPanel';
import { UrlImport } from '@/components/UrlImport';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  completeQuiz,
  ensureTodayLesson,
  fetchGenerationStatus,
  fetchState,
  importUrl,
  saveSettings,
} from '@/lib/messaging';
import type {
  AppState,
  GenerationStatus,
  Settings,
  StoredLesson,
} from '@/lib/types';
import { BookOpen, Flame, RefreshCw, Sparkles } from 'lucide-react';

type LessonView = 'article' | 'quiz';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [lessonView, setLessonView] = useState<LessonView>('article');
  const [activeLesson, setActiveLesson] = useState<StoredLesson | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<GenerationStatus>({
    phase: 'idle',
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchState();
    setState(next);
    setActiveLesson((current) => {
      if (current?.sourceUrl) {
        // Keep imported lesson in view until user regenerates today
        const stillThere =
          next.history.find((h) => h.date === current.date) && current;
        return stillThere || next.todayLesson;
      }
      return next.todayLesson;
    });
    return next;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (!generating) return;
    const id = window.setInterval(() => {
      void fetchGenerationStatus()
        .then(setGenStatus)
        .catch(() => undefined);
    }, 800);
    return () => window.clearInterval(id);
  }, [generating]);

  async function runGenerate(force = false) {
    setActionError(null);
    setGenerating(true);
    setGenStatus({ phase: 'creating', message: 'Starting…' });
    try {
      const lesson = await ensureTodayLesson(force);
      setActiveLesson(lesson);
      setLessonView('article');
      setActiveTab('today');
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setActionError(message);
      const status = await fetchGenerationStatus().catch(() => null);
      if (status) setGenStatus(status);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveSettings(settings: Settings) {
    const next = await saveSettings(settings);
    setState(next);
  }

  async function handleCompleteQuiz(
    date: string,
    answers: number[],
    score: number,
  ) {
    const next = await completeQuiz(date, answers, score);
    setState(next);
    setActiveLesson((prev) =>
      prev && prev.date === date
        ? {
            ...prev,
            quizCompleted: true,
            quizScore: score,
            quizAnswers: answers,
          }
        : prev,
    );
  }

  async function handleImport(url: string) {
    setUrlError(null);
    setGenerating(true);
    setGenStatus({ phase: 'creating', message: 'Fetching article…' });
    try {
      const lesson = await importUrl(url);
      setActiveLesson(lesson);
      setLessonView('article');
      setActiveTab('today');
      await refresh();
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Loading Daily Learner…
      </div>
    );
  }

  const lesson = activeLesson ?? state.todayLesson;
  const missingKey = !state.settings.apiKey.trim();
  const statusMessage =
    genStatus.phase === 'error'
      ? genStatus.message
      : genStatus.phase === 'idle' || genStatus.phase === 'done'
        ? 'Working…'
        : genStatus.message;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border/70 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="animate-fade-up space-y-1">
            <p className="font-display text-2xl font-semibold tracking-tight text-primary">
              Daily Learner
            </p>
            <p className="text-sm text-muted-foreground">
              One fresh article and quiz each day—powered by Cursor cloud agents.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
            <Flame className="size-3.5 text-accent" />
            {state.streak}
          </div>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3"
      >
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          <TabsContent value="today" className="mt-0 space-y-4 pb-6">
            {missingKey && !lesson && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
                <p className="font-medium">Add a Cursor API key to begin</p>
                <p className="mt-1 text-muted-foreground">
                  Open Settings, paste a key from the Cursor Dashboard, then
                  generate today’s lesson.
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                >
                  Open settings
                </Button>
              </div>
            )}

            {generating && <GeneratingState message={statusMessage} />}

            {actionError && !generating && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            )}

            {!lesson && !generating && (
              <div className="space-y-3 rounded-xl border border-dashed border-border bg-card/60 px-4 py-8 text-center">
                <Sparkles className="mx-auto size-8 text-primary" />
                <div className="space-y-1">
                  <p className="font-display text-lg font-semibold">
                    Today’s lesson isn’t ready yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Generate a short article and a 5-question quiz with your
                    Cursor API key.
                  </p>
                </div>
                <Button
                  onClick={() => void runGenerate(false)}
                  disabled={missingKey}
                >
                  <BookOpen className="size-4" />
                  Generate today’s lesson
                </Button>
              </div>
            )}

            {lesson && !generating && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={lessonView === 'article' ? 'default' : 'outline'}
                    onClick={() => setLessonView('article')}
                  >
                    Article
                  </Button>
                  <Button
                    size="sm"
                    variant={lessonView === 'quiz' ? 'default' : 'outline'}
                    onClick={() => setLessonView('quiz')}
                  >
                    Quiz
                  </Button>
                  <div className="flex-1" />
                  {!lesson.sourceUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void runGenerate(true)}
                      disabled={missingKey}
                      title="Regenerate today"
                    >
                      <RefreshCw className="size-4" />
                      Regen
                    </Button>
                  )}
                </div>
                <Separator />
                {lessonView === 'article' ? (
                  <ArticleReader lesson={lesson} />
                ) : (
                  <Quiz
                    lesson={lesson}
                    onComplete={(answers, score) =>
                      handleCompleteQuiz(lesson.date, answers, score)
                    }
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="import" className="mt-0 pb-6">
            {generating && activeTab === 'import' && (
              <div className="mb-4">
                <GeneratingState message={statusMessage} />
              </div>
            )}
            <UrlImport
              busy={generating}
              error={urlError}
              onImport={handleImport}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0 pb-6">
            <HistoryList history={state.history} streak={state.streak} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 pb-6">
            <SettingsPanel
              settings={state.settings}
              onSave={handleSaveSettings}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
