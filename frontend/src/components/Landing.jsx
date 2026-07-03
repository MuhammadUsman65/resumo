import { useNavigate } from "react-router-dom";
import Chip from "../components/Chip";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-10 flex-1">
        <header className="flex justify-between items-center pt-9">
          <div className="font-display font-bold text-xl">
            resu<span className="text-brand">mo</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center pt-16">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-brand mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
              Resume &times; Job Description
            </div>

            <h1 className="font-display font-bold text-5xl leading-[1.05] tracking-tight mb-6">
              Find out what your resume is{" "}
              <span className="underline decoration-match decoration-4 underline-offset-[6px]">
                missing
              </span>
              .
            </h1>

            <p className="text-lg leading-relaxed text-ink/70 max-w-md mb-9">
              Resumo compares your resume against any job description, keyword
              by keyword, and gives you an honest ATS-style score plus exactly
              what to fix before you hit submit.
            </p>

            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate("/app")}
                className="font-semibold text-[15.5px] bg-brand text-white px-7 py-4 rounded-lg inline-flex items-center gap-2.5 hover:opacity-90 transition"
              >
                Get Started <span className="font-mono">&rarr;</span>
              </button>
              <span className="text-[13px] text-ink/50">
                No sign-up. Nothing saved.
              </span>
            </div>
          </div>

          {/* signature visual — two document cards with matched/gap keyword
              chips diffing between them. Same <Chip> component used here
              renders the real results later, on purpose. */}
          <div className="relative h-[420px] hidden md:block">
            <DocCard
              label="Job Description"
              className="top-2 left-0 -rotate-3"
              lines={["w-4/5", "w-full", "w-3/5", "w-5/6"]}
            />
            <DocCard
              label="Your Resume"
              className="bottom-2 right-0 rotate-2"
              lines={["w-11/12", "w-3/4", "w-5/6"]}
            />

            <div className="absolute top-14 left-40">
              <Chip label="React" state="match" />
            </div>
            <div className="absolute top-32 left-14">
              <Chip label="Node.js" state="match" />
            </div>
            <div className="absolute top-48 left-52">
              <Chip label="Docker" state="gap" />
            </div>
            <div className="absolute top-64 left-20">
              <Chip label="MongoDB" state="match" />
            </div>
            <div className="absolute top-80 left-52">
              <Chip label="GraphQL" state="gap" />
            </div>
            <div className="absolute top-4 left-64">
              <Chip label="TypeScript" state="gap" />
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-line mt-16">
        <div className="max-w-6xl mx-auto px-10 py-6 flex justify-between items-center">
          <span className="text-[13px] text-ink/50">
            A project of Muhammad Usman
          </span>
          <span className="font-mono text-xs text-ink/40">v1.0</span>
        </div>
      </footer>
    </div>
  );
}

function DocCard({ label, className, lines }) {
  return (
    <div
      className={`absolute w-56 bg-white border-[1.5px] border-line rounded-2xl p-5 shadow-[0_10px_30px_-12px_rgba(18,33,60,0.12)] ${className}`}
    >
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink/45 mb-3.5">
        {label}
      </div>
      {lines.map((w, i) => (
        <div key={i} className={`h-1.5 bg-line rounded ${w} mb-2.5`} />
      ))}
    </div>
  );
}
