import { useEffect, useState } from "react";
import { getSuggestions } from "../lib/api";
import { Spinner, ErrorBanner } from "./StatusMessage";

export default function SuggestionsPanel({ analysis, jdText, onLoaded }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getSuggestions({
      resumeText: analysis.resumeText,
      jdText,
      missingKeywords: analysis.missingKeywords,
      keywordScore: analysis.breakdown.keywordScore,
      structureDetails: analysis.structureDetails,
      completenessDetails: analysis.completenessDetails,
    })
      .then((data) => {
        if (!cancelled) {
          setSuggestions(data);
          onLoaded?.(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-semibold text-ink">
        AI Suggestions
      </h3>

      {loading && <Spinner label="Generating suggestions..." />}
      {error && <ErrorBanner message={`Suggestions unavailable: ${error}`} />}

      {suggestions && (
        <div className="space-y-5">
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wide text-ink/50">
              Suggested summary
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {suggestions.summarySuggestion}
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wide text-ink/50">
              Suggested bullet points
            </h4>
            <ul className="mt-1 space-y-2">
              {suggestions.bulletSuggestions.map((b, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm leading-relaxed text-ink"
                >
                  <span className="text-brand">-</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wide text-ink/50">
              General tips
            </h4>
            <ul className="mt-1 space-y-2">
              {suggestions.generalTips.map((t, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm leading-relaxed text-ink"
                >
                  <span className="text-gap">-</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
