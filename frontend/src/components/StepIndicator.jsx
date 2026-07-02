const STEPS = [
  { n: 1, label: "Job Description" },
  { n: 2, label: "Resume" },
  { n: 3, label: "Results" },
];

export default function StepIndicator({ current }) {
  return (
    <ol className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wide">
      {STEPS.map((step, i) => {
        const active = step.n === current;
        const done = step.n < current;
        return (
          <li key={step.n} className="flex items-center gap-3">
            <span
              className={
                active
                  ? "flex h-6 w-6 items-center justify-center rounded-full border border-brand bg-brand text-[11px] text-paper"
                  : done
                    ? "flex h-6 w-6 items-center justify-center rounded-full border border-match bg-match text-[11px] text-paper"
                    : "flex h-6 w-6 items-center justify-center rounded-full border border-line text-[11px] text-ink/40"
              }
            >
              {done ? "✓" : step.n}
            </span>
            <span className={active ? "text-ink" : "text-ink/40"}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}
