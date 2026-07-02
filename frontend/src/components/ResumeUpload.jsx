import { useRef, useState } from "react";

const ACCEPTED = [".pdf", ".docx"];

export default function ResumeUpload({
  file,
  onChange,
  onBack,
  onAnalyze,
  loading,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  function validateAndSet(f) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      setLocalError(
        "Please upload a .pdf or .docx file. Legacy .doc files are not supported, re-save as .docx first.",
      );
      return;
    }
    setLocalError("");
    onChange(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        2. Upload your resume
      </h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={
          dragOver
            ? "flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-brand bg-brand/5 px-6 py-14 text-center transition"
            : "flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-line px-6 py-14 text-center transition hover:border-ink/30"
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
        {file ? (
          <>
            <p className="font-mono text-sm text-ink">{file.name}</p>
            <p className="mt-1 font-mono text-xs text-ink/40">
              {(file.size / 1024).toFixed(0)} KB · click to replace
            </p>
          </>
        ) : (
          <>
            <p className="font-body text-sm text-ink/70">
              Drag and drop your resume here, or click to browse
            </p>
            <p className="mt-1 font-mono text-xs text-ink/40">
              PDF or DOCX only
            </p>
          </>
        )}
      </div>

      {localError && (
        <p className="rounded border border-gap/40 bg-gap/10 px-4 py-2 text-sm text-gap">
          {localError}
        </p>
      )}

      <p className="font-mono text-xs text-ink/40">
        Your resume text is sent to a third-party AI service to generate
        suggestions. Nothing is stored on our servers.
      </p>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ink"
        >
          ← Back
        </button>
        <button
          onClick={onAnalyze}
          disabled={!file || loading}
          className="rounded bg-brand px-5 py-2 font-mono text-xs uppercase tracking-wide text-paper transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? "Analyzing..." : "Analyze →"}
        </button>
      </div>
    </div>
  );
}
