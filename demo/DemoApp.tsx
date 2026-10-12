import { useMemo, useState } from 'react';
import { ArticleReader } from '@/components/ArticleReader';
import { GeneratingState } from '@/components/GeneratingState';
import { HistoryList } from '@/components/HistoryList';
import { Quiz } from '@/components/Quiz';
import { SettingsPanel } from '@/components/SettingsPanel';
import { UrlImport } from '@/components/UrlImport';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Settings, StoredLesson } from '@/lib/types';
import { BookOpen, Flame, Sparkles } from 'lucide-react';

const SAMPLE_LESSON: StoredLesson = {
  date: '2026-10-12',
  createdAt: new Date().toISOString(),
  title: 'How coral reefs build islands from living stone',
  topic: 'Marine biology',
  articleMarkdown: `## Living architects of the sea

Coral reefs are among the most productive ecosystems on Earth. Tiny colonial animals called polyps secrete calcium carbonate skeletons that, over centuries, accumulate into massive structures.

### Why reefs matter

Reefs protect coastlines from storm surge, host extraordinary biodiversity, and support fisheries that feed hundreds of millions of people. Warming oceans and acidification threaten these living cities—making reef literacy a useful daily topic.

### A closer look

Branching corals grow quickly but break easily; massive brain corals grow slowly and endure. Together they form the complex topography that shelters fish, invertebrates, and algae.`,
  sources: [
    'https://oceanservice.noaa.gov/facts/coralreef.html',
    'https://www.britannica.com/science/coral-reef',
  ],
  quiz: [
    {
      question: 'What do coral polyps secrete to build reef structure?',
      choices: [
        'Silica shells',
        'Calcium carbonate',
        'Cellulose fibers',
        'Iron oxide',
      ],
      correctIndex: 1,
      explanation:
        'Polyps secrete calcium carbonate skeletons that accumulate into reef rock.',
    },
    {
      question: 'Which pressure most directly threatens reef-building corals?',
      choices: [
        'Increased deep-sea mining only',
        'Cooler surface waters',
        'Ocean warming and acidification',
        'Lower salinity alone',
      ],
      correctIndex: 2,
      explanation:
        'Warming causes bleaching; acidification makes skeleton building harder.',
    },
    {
      question: 'Compared with brain corals, branching corals typically…',
      choices: [
        'Grow slower and never break',
        'Grow faster but break more easily',
        'Cannot form topography',
        'Live only in freshwater',
      ],
      correctIndex: 1,
      explanation:
        'Branching forms grow quickly and are more fragile than massive brain corals.',
    },
    {
      question: 'One coastal benefit of reefs is…',
      choices: [
        'Blocking all sunlight',
        'Absorbing storm surge energy',
        'Eliminating tides',
        'Freezing seawater',
      ],
      correctIndex: 1,
      explanation: 'Reef structure dissipates wave energy and buffers shorelines.',
    },
    {
      question: 'Coral reefs are best described as…',
      choices: [
        'Abiotic rock piles only',
        'Living ecosystems built by colonial animals',
        'Temporary foam mats',
        'Volcanic glass shelves',
      ],
      correctIndex: 1,
      explanation:
        'Reefs are biogenic structures continually built by living polyps and symbionts.',
    },
  ],
};

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  interests: ['science', 'history', 'technology'],
  notificationsEnabled: true,
  dailyTime: '08:00',
};

type Mode = 'empty' | 'article' | 'quiz' | 'settings' | 'import' | 'generating';

export default function DemoApp() {
  const [mode, setMode] = useState<Mode>('empty');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [lessonView, setLessonView] = useState<'article' | 'quiz'>('article');

  const history = useMemo(
    () => [
      {
        date: '2026-10-11',
        title: 'The surprising physics of sourdough crumb',
        topic: 'Food science',
        completed: true,
        score: 4,
      },
      {
        date: '2026-10-10',
        title: 'How city trees cool summer heat islands',
        topic: 'Urban ecology',
        completed: true,
        score: 5,
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#d9e4e8] p-6">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex flex-wrap gap-1 border-b border-border bg-card px-3 py-2">
          {(
            [
              ['empty', 'Empty'],
              ['article', 'Article'],
              ['quiz', 'Quiz'],
              ['import', 'Import'],
              ['settings', 'Settings'],
              ['generating', 'Generating'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                if (id === 'article') setLessonView('article');
                if (id === 'quiz') setLessonView('quiz');
              }}
              className={`rounded-md px-2 py-1 text-xs ${
                mode === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex h-[720px] min-h-0 flex-col">
          <header className="shrink-0 border-b border-border/70 px-4 pb-3 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="animate-fade-up space-y-1">
                <p className="font-display text-2xl font-semibold tracking-tight text-primary">
                  Daily Learner
                </p>
                <p className="text-sm text-muted-foreground">
                  One fresh article and quiz each day—powered by Cursor cloud
                  agents.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
                <Flame className="size-3.5 text-accent" />
                2
              </div>
            </div>
          </header>

          {mode === 'generating' ? (
            <div className="space-y-4 p-4">
              <GeneratingState message="Researching and writing…" />
            </div>
          ) : mode === 'empty' ? (
            <div className="space-y-4 p-4">
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
                <p className="font-medium">Add a Cursor API key to begin</p>
                <p className="mt-1 text-muted-foreground">
                  Open Settings, paste a key from the Cursor Dashboard, then
                  generate today’s lesson.
                </p>
              </div>
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
                <Button onClick={() => setMode('settings')}>
                  <BookOpen className="size-4" />
                  Open settings
                </Button>
              </div>
            </div>
          ) : (
            <Tabs
              value={
                mode === 'article' || mode === 'quiz'
                  ? 'today'
                  : mode === 'import'
                    ? 'import'
                    : mode === 'settings'
                      ? 'settings'
                      : 'history'
              }
              className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3"
            >
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="import">Import</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {(mode === 'article' || mode === 'quiz') && (
                  <TabsContent value="today" className="mt-0 space-y-4 pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant={
                          lessonView === 'article' ? 'default' : 'outline'
                        }
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
                    </div>
                    <Separator />
                    {lessonView === 'article' ? (
                      <ArticleReader lesson={SAMPLE_LESSON} />
                    ) : (
                      <Quiz
                        lesson={SAMPLE_LESSON}
                        onComplete={async () => undefined}
                      />
                    )}
                  </TabsContent>
                )}
                {mode === 'import' && (
                  <TabsContent value="import" className="mt-0 pb-6">
                    <UrlImport busy={false} onImport={async () => undefined} />
                  </TabsContent>
                )}
                {mode === 'settings' && (
                  <TabsContent value="settings" className="mt-0 pb-6">
                    <SettingsPanel
                      settings={settings}
                      onSave={async (next) => setSettings(next)}
                    />
                  </TabsContent>
                )}
                <TabsContent value="history" className="mt-0 pb-6">
                  <HistoryList history={history} streak={2} />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
