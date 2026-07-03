import Chip from "./Chip";

function ringClass(score) {
  if (score >= 75) return "border-match text-match bg-match/10";
  return "border-gap text-gap bg-gap/10";
}

function barColor(score) {
  return score >= 75 ? "#0F7A6B" : "#B8622A";
}

function scoreLabel(score) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Partial match";
  return "Needs work";
}

export default function ScoreCard({ analysis }) {
  const { finalScore, breakdown, matchedKeywords, missingKeywords } = analysis;

  return (
    <div className="border-[1.5px] border-line rounded-2xl bg-white p-8 mb-5">
      <div className="flex items-center gap-7 mb-7 flex-wrap">
        <div
          className={`w-28 h-28 rounded-full border-[3px] flex flex-col items-center justify-center shrink-0 ${ringClass(finalScore)}`}
        >
          <div className="font-mono font-medium text-2xl">
            {finalScore.toFixed(1)}
          </div>
          <div className="font-mono text-[10.5px] opacity-50">/ 100</div>
        </div>
        <div>
          <h2 className="font-display text-xl mb-1.5">
            {scoreLabel(finalScore)}
          </h2>
          <p className="text-sm text-ink/65 leading-relaxed max-w-md">
            {missingKeywords.length === 0
              ? "Your resume covers every keyword this job description asks for."
              : `${missingKeywords.length} keyword${missingKeywords.length === 1 ? "" : "s"} from the job description ${missingKeywords.length === 1 ? "wasn't" : "weren't"} found in your resume — see below.`}
          </p>
        </div>
      </div>

      <ScoreBar
        label="Keyword Match"
        weight="50%"
        score={breakdown.keywordScore}
      />
      <ScoreBar
        label="Resume Structure"
        weight="30%"
        score={breakdown.structureScore}
      />
      <ScoreBar
        label="Completeness"
        weight="20%"
        score={breakdown.completenessScore}
      />

      <div className="h-px bg-line my-6" />

      <ChipGroupLabel>Matched keywords</ChipGroupLabel>
      <div className="flex flex-wrap gap-2 mb-5">
        {matchedKeywords.length > 0 ? (
          matchedKeywords.map((k) => <Chip key={k} label={k} state="match" />)
        ) : (
          <p className="text-sm text-ink/45">None detected.</p>
        )}
      </div>

      <ChipGroupLabel>Missing keywords</ChipGroupLabel>
      <div className="flex flex-wrap gap-2">
        {missingKeywords.length > 0 ? (
          missingKeywords.map((k) => <Chip key={k} label={k} state="gap" />)
        ) : (
          <p className="text-sm text-ink/45">None — full coverage.</p>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, weight, score }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-[13px] mb-1.5">
        <span className="font-medium">
          {label} &middot; {weight}
        </span>
        <span className="font-mono opacity-55">{score.toFixed(1)}</span>
      </div>
      <div className="h-[7px] bg-[#EFEDE7] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
            backgroundColor: barColor(score),
          }}
        />
      </div>
    </div>
  );
}

function ChipGroupLabel({ children }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-wider text-ink/45 mb-3">
      {children}
    </div>
  );
}
