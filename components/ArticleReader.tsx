import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { StoredLesson } from '@/lib/types';

interface ArticleReaderProps {
  lesson: StoredLesson;
}

export function ArticleReader({ lesson }: ArticleReaderProps) {
  return (
    <article className="animate-fade-up space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{lesson.topic}</Badge>
          {lesson.sourceUrl ? (
            <Badge variant="secondary">From link</Badge>
          ) : (
            <Badge variant="secondary">{lesson.date}</Badge>
          )}
        </div>
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground">
          {lesson.title}
        </h1>
      </header>

      <div className="prose-learner space-y-3 text-[15px] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold">
        <ReactMarkdown>{lesson.articleMarkdown}</ReactMarkdown>
      </div>

      {lesson.sources?.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </h2>
            <ul className="space-y-1.5 text-sm">
              {lesson.sources.map((src) => (
                <li key={src} className="break-all">
                  <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {src}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </article>
  );
}
