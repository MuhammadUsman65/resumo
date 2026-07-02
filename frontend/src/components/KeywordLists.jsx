function KeywordGroup({ title, keywords, tone }) {
  const toneClasses =
    tone === "match"
      ? "border-match/40 bg-match/10 text-match"
      : "border-gap/40 bg-gap/10 text-gap";

  return (
    <div className="space-y-2">
      <h3 className="font-mono text-xs uppercase tracking-wide text-ink/50">
        {title} ({keywords.length})
      </h3>
      {keywords.length === 0 ? (
        <p className="text-sm text-ink/40">None found.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className={`rounded-full border px-3 py-1 font-mono text-xs ${toneClasses}`}
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KeywordLists({ matchedKeywords, missingKeywords }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <KeywordGroup title="Matched" keywords={matchedKeywords} tone="match" />
      <KeywordGroup title="Missing" keywords={missingKeywords} tone="gap" />
    </div>
  );
}
