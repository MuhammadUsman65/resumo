export default function NameConfirm({ value, onChange }) {
  return (
    <div className="border-[1.5px] border-line rounded-2xl bg-white px-8 py-6 mb-5 flex items-center justify-between gap-6 flex-wrap">
      <div>
        <div className="font-display font-semibold text-[15.5px] mb-1">
          This report is for {value?.trim() ? value : "\u2026"}
        </div>
        <div className="text-xs text-ink/50">
          {value
            ? "Detected from your resume — edit if that's not right"
            : "We couldn't detect a name — type it in"}
        </div>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your name"
        className="font-body font-medium text-[15px] border-[1.5px] border-brand rounded-lg px-4 py-2.5 min-w-[220px] focus:outline-none"
      />
    </div>
  );
}
