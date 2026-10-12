import { Badge } from '@/components/ui/badge';
import type { HistoryEntry } from '@/lib/types';

interface HistoryListProps {
  history: HistoryEntry[];
  streak: number;
}

export function HistoryList({ history, streak }: HistoryListProps) {
  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">History</h2>
          <p className="text-sm text-muted-foreground">
            Completed days and imported articles.
          </p>
        </div>
        <Badge variant="accent" className="shrink-0">
          {streak} day streak
        </Badge>
      </div>

      {history.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-3 py-6 text-center text-sm text-muted-foreground">
          Finish today’s quiz or import a link to start your history.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li
              key={entry.date}
              className="rounded-lg border border-border/80 bg-card/70 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.sourceUrl ? 'Imported' : entry.date}
                    {entry.topic ? ` · ${entry.topic}` : ''}
                  </p>
                </div>
                {entry.completed ? (
                  <Badge variant="secondary">
                    {typeof entry.score === 'number'
                      ? `${entry.score}/5`
                      : 'Done'}
                  </Badge>
                ) : (
                  <Badge variant="outline">Open</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
