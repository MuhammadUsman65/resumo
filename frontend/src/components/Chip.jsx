export default function Chip({ label, state }) {
  const isMatch = state === "match";
  return (
    <span
      className={
        "font-mono text-[12.5px] font-medium px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 bg-white shadow-[0_6px_16px_-8px_rgba(18,33,60,0.18)] " +
        (isMatch
          ? "border-[1.5px] border-match text-match"
          : "border-[1.5px] border-dashed border-gap text-gap")
      }
    >
      {isMatch && <span className="font-bold">&#10003;</span>}
      {label}
    </span>
  );
}
