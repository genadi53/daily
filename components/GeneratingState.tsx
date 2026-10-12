interface GeneratingStateProps {
  message: string;
}

export function GeneratingState({ message }: GeneratingStateProps) {
  return (
    <div className="animate-fade-up space-y-3 rounded-xl border border-border/80 bg-card/70 p-4">
      <div className="GeneratingBar h-1.5 w-full rounded-full" />
      <p className="animate-pulse-soft text-sm font-medium text-foreground">
        Generating…
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Cloud agent runs take longer than a chat reply. This panel updates as
        the run streams.
      </p>
    </div>
  );
}
