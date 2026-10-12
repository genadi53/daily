import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2 } from 'lucide-react';

interface UrlImportProps {
  busy: boolean;
  error?: string | null;
  onImport: (url: string) => Promise<void>;
}

export function UrlImport({ busy, error, onImport }: UrlImportProps) {
  const [url, setUrl] = useState('');

  return (
    <div className="animate-fade-up space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Learn from a link</h2>
        <p className="text-sm text-muted-foreground">
          Paste any public article URL. We extract the readable text, then ask a
          Cursor cloud agent for a summary and quiz.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="articleUrl">Article URL</Label>
        <div className="flex gap-2">
          <Input
            id="articleUrl"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            disabled={busy}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            disabled={busy || !url.trim()}
            onClick={() => onImport(url.trim())}
          >
            <Link2 className="size-4" />
            {busy ? 'Working…' : 'Import'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
