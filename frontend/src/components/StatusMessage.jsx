export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded border border-gap/40 bg-gap/10 px-4 py-3 text-sm text-gap">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 font-mono text-xs uppercase tracking-wide text-gap/80 hover:text-gap"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink/60">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-brand" />
      {label && <span className="font-mono">{label}</span>}
    </div>
  );
}
