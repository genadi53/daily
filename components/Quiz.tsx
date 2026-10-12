import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredLesson } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

interface QuizProps {
  lesson: StoredLesson;
  onComplete: (answers: number[], score: number) => Promise<void>;
}

export function Quiz({ lesson, onComplete }: QuizProps) {
  const total = lesson.quiz.length;
  const [answers, setAnswers] = useState<number[]>(
    lesson.quizAnswers ?? Array(total).fill(-1),
  );
  const [submitted, setSubmitted] = useState(Boolean(lesson.quizCompleted));
  const [saving, setSaving] = useState(false);
  const [index, setIndex] = useState(0);

  const score = useMemo(() => {
    return lesson.quiz.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correctIndex ? 1 : 0);
    }, 0);
  }, [answers, lesson.quiz]);

  const current = lesson.quiz[index];
  const allAnswered = answers.every((a) => a >= 0);

  async function handleSubmit() {
    if (!allAnswered || submitted) return;
    setSaving(true);
    try {
      await onComplete(answers, score);
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  }

  if (!current) {
    return (
      <p className="text-sm text-muted-foreground">No quiz questions available.</p>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Quiz</h2>
        <Badge variant="secondary">
          {index + 1} / {total}
        </Badge>
      </div>

      <div className="flex gap-1.5">
        {lesson.quiz.map((_, i) => {
          const answered = (answers[i] ?? -1) >= 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i === index
                  ? 'bg-primary'
                  : answered
                    ? 'bg-primary/40'
                    : 'bg-border',
              )}
              aria-label={`Question ${i + 1}`}
            />
          );
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm">
        <p className="text-[15px] font-medium leading-snug">{current.question}</p>
        <div className="space-y-2">
          {current.choices.map((choice, choiceIndex) => {
            const selected = answers[index] === choiceIndex;
            const isCorrect = choiceIndex === current.correctIndex;
            const showResult = submitted;

            return (
              <button
                key={choiceIndex}
                type="button"
                disabled={submitted}
                onClick={() => {
                  const next = [...answers];
                  next[index] = choiceIndex;
                  setAnswers(next);
                }}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                  selected && !showResult && 'border-primary bg-primary/5',
                  !selected && !showResult && 'border-border hover:bg-secondary/60',
                  showResult && isCorrect && 'border-primary/60 bg-primary/10',
                  showResult &&
                    selected &&
                    !isCorrect &&
                    'border-destructive/50 bg-destructive/5',
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {showResult && isCorrect ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : showResult && selected && !isCorrect ? (
                    <XCircle className="size-4 text-destructive" />
                  ) : (
                    <Circle
                      className={cn(
                        'size-4',
                        selected ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                  )}
                </span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <p className="rounded-md bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Explanation: </span>
            {current.explanation}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        {index < total - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
            Next
          </Button>
        ) : !submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
            variant="accent"
          >
            {saving ? 'Saving…' : 'Submit quiz'}
          </Button>
        ) : (
          <Badge variant="accent" className="px-3 py-1.5 text-sm">
            Score {score}/{total}
          </Badge>
        )}
      </div>

      {submitted && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm animate-fade-up">
          You scored <strong>{score}</strong> out of <strong>{total}</strong>.
          Review explanations above to lock in what you learned.
        </div>
      )}
    </div>
  );
}
