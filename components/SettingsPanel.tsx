import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Settings } from '@/lib/types';
import { ExternalLink, KeyRound } from 'lucide-react';

interface SettingsPanelProps {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const interests = draft.interests
        .map((i) => i.trim())
        .filter(Boolean);
      await onSave({ ...draft, interests });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Your Cursor API key stays in local extension storage on this device.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey" className="flex items-center gap-1.5">
          <KeyRound className="size-3.5" />
          Cursor API key
        </Label>
        <Input
          id="apiKey"
          type="password"
          autoComplete="off"
          placeholder="Paste key from Cursor Dashboard"
          value={draft.apiKey}
          onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
        />
        <a
          href="https://cursor.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Open Cursor Dashboard → API Keys
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interests">Interest tags</Label>
        <Input
          id="interests"
          placeholder="science, history, technology"
          value={draft.interests.join(', ')}
          onChange={(e) =>
            setDraft({
              ...draft,
              interests: e.target.value.split(',').map((s) => s.trim()),
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated topics used when picking today’s lesson.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyTime">Daily pre-generate time</Label>
        <Input
          id="dailyTime"
          type="time"
          value={draft.dailyTime}
          onChange={(e) => setDraft({ ...draft, dailyTime: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Local time for the morning alarm that pre-generates today’s lesson.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-3 py-2.5">
        <div className="space-y-0.5 pr-3">
          <Label htmlFor="notifications">Notifications</Label>
          <p className="text-xs text-muted-foreground">
            Prefer a quiet reminder when the daily lesson is ready.
          </p>
        </div>
        <Switch
          id="notifications"
          checked={draft.notificationsEnabled}
          onCheckedChange={(checked) =>
            setDraft({ ...draft, notificationsEnabled: checked })
          }
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
        {saved && (
          <span className="text-sm text-primary animate-fade-up">Saved</span>
        )}
      </div>
    </div>
  );
}
