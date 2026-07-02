export default function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Resumo
          </span>
          <span className="font-mono text-xs text-ink/40">v1</span>
        </div>
        <span className="hidden font-mono text-xs  tracking-widest text-ink/40 sm:block">
          A project of Muhammad Usman
        </span>
      </div>
    </header>
  );
}
