export default function StepCard({ number, title, children }) {
  return (
    <div className="border-[1.5px] border-line rounded-2xl bg-white p-7 mb-5">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="font-mono text-xs font-medium w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center shrink-0">
          {number}
        </div>
        <div className="font-display font-semibold text-[15.5px]">{title}</div>
      </div>
      {children}
    </div>
  );
}
