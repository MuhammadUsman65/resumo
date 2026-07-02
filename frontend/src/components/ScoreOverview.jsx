function scoreBand(score) {
  if (score >= 75) return "good";
  if (score >= 50) return "mid";
  return "low";
}

const STAMP_CLASSES = {
  good: "border-match text-match",
  mid: "border-brand text-brand",
  low: "border-gap text-gap",
};

const BAR_CLASSES = {
  good: "bg-match",
  mid: "bg-brand",
  low: "bg-gap",
};

function ScoreBar({ label, weight, score }) {
  const band = scoreBand(score);
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-xs text-ink/60">
        <span>
          {label} <span className="text-ink/30">({weight})</span>
        </span>
        <span>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-2 rounded-full ${BAR_CLASSES[band]}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreOverview({
  finalScore,
  breakdown,
  candidateName,
}) {
  const band = scoreBand(finalScore);
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div
        className={`flex h-32 w-32 shrink-0 -rotate-3 flex-col items-center justify-center rounded border-2 border-dashed ${STAMP_CLASSES[band]}`}
      >
        <span className="font-mono text-3xl font-bold">
          {finalScore.toFixed(1)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
          out of 100
        </span>
      </div>
      <div className="flex-1 space-y-3">
        {candidateName && (
          <p className="font-mono text-xs text-ink/40">
            Analysis for {candidateName}
          </p>
        )}
        <ScoreBar
          label="Keyword Match"
          weight="50%"
          score={breakdown.keywordScore}
        />
        <ScoreBar
          label="Structure"
          weight="30%"
          score={breakdown.structureScore}
        />
        <ScoreBar
          label="Completeness"
          weight="20%"
          score={breakdown.completenessScore}
        />
      </div>
    </div>
  );
}
