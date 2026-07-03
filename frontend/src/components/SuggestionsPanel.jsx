export default function SuggestionsPanel({
  suggestions,
  loading,
  error,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="border-[1.5px] border-brand rounded-2xl bg-brand/5 p-7 mb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-brand mb-2">
          AI Suggestions
        </p>
        <p className="text-sm text-ink/55">Generating suggestions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-[1.5px] border-line rounded-2xl bg-white p-7 mb-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-ink/55">
          AI suggestions couldn't be generated.
        </p>
        <button
          onClick={onRetry}
          className="text-sm font-medium text-brand shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!suggestions) return null;

  return (
    <div className="border-[1.5px] border-brand rounded-2xl bg-brand/5 p-8 mb-5">
      <p className="font-mono text-xs uppercase tracking-wider text-brand mb-4">
        AI Suggestions
      </p>

      <h3 className="font-display font-semibold text-[15px] mb-2">
        Suggested summary
      </h3>
      <p className="text-[13.5px] leading-relaxed text-ink/80 mb-5">
        {suggestions.summarySuggestion}
      </p>

      {suggestions.bulletSuggestions?.length > 0 && (
        <>
          <h3 className="font-display font-semibold text-[15px] mb-2">
            Bullet point suggestions
          </h3>
          <ul className="mb-5 space-y-1.5">
            {suggestions.bulletSuggestions.map((b, i) => (
              <SuggestionLine key={i}>{b}</SuggestionLine>
            ))}
          </ul>
        </>
      )}

      {suggestions.generalTips?.length > 0 && (
        <>
          <h3 className="font-display font-semibold text-[15px] mb-2">
            General tips
          </h3>
          <ul className="space-y-1.5">
            {suggestions.generalTips.map((t, i) => (
              <SuggestionLine key={i}>{t}</SuggestionLine>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function SuggestionLine({ children }) {
  return (
    <li className="text-[13.5px] leading-relaxed text-ink/80 pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-ink/40">
      {children}
    </li>
  );
}
