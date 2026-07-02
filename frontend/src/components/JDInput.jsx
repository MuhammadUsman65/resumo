import { useState } from "react";
import { ocrImage } from "../lib/api";
import { Spinner, ErrorBanner } from "./StatusMessage";

export default function JDInput({ jdText, onChange, onNext }) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setOcrLoading(true);
    try {
      const { extractedText } = await ocrImage(file);
      onChange(extractedText);
    } catch (err) {
      setError(err.message);
    } finally {
      setOcrLoading(false);
      e.target.value = "";
    }
  }

  const canContinue = jdText.trim().length > 20;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          1. Paste the job description
        </h2>
        <label className="cursor-pointer rounded border border-line px-3 py-1.5 font-mono text-xs text-ink/60 hover:border-ink/30 hover:text-ink">
          Upload a screenshot instead
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
        </label>
      </div>

      {ocrLoading && <Spinner label="Reading text from image..." />}
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <textarea
        value={jdText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job description here, or upload a screenshot above and we'll extract the text for you to review."
        rows={12}
        className="w-full resize-y rounded border border-line bg-white/60 p-4 font-body text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none"
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink/40">
          {jdText.trim().length} characters
        </span>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="rounded bg-brand px-5 py-2 font-mono text-xs uppercase tracking-wide text-paper transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
