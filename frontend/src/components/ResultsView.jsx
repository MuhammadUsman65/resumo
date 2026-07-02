import { useState } from "react";
import ScoreOverview from "./ScoreOverview";
import KeywordLists from "./KeywordLists";
import SuggestionsPanel from "./SuggestionsPanel";
import { downloadReport } from "../lib/api";
import { ErrorBanner } from "./StatusMessage";

export default function ResultsView({ analysis, jdText, onStartOver }) {
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [suggestionsForReport, setSuggestionsForReport] = useState(null);

  async function handleDownload() {
    setReportError("");
    setReportLoading(true);
    try {
      await downloadReport({
        finalScore: analysis.finalScore,
        breakdown: analysis.breakdown,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        structureDetails: analysis.structureDetails,
        completenessDetails: analysis.completenessDetails,
        suggestions: suggestionsForReport,
        candidateName: analysis.candidateName,
      });
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <h2 className="font-display text-lg font-semibold text-ink">
        3. Results
      </h2>

      <ScoreOverview
        finalScore={analysis.finalScore}
        breakdown={analysis.breakdown}
        candidateName={analysis.candidateName}
      />

      <KeywordLists
        matchedKeywords={analysis.matchedKeywords}
        missingKeywords={analysis.missingKeywords}
      />

      <div className="border-t border-line pt-8">
        <SuggestionsPanel
          analysis={analysis}
          jdText={jdText}
          onLoaded={setSuggestionsForReport}
        />
      </div>

      <ErrorBanner message={reportError} onDismiss={() => setReportError("")} />

      <div className="flex items-center justify-between border-t border-line pt-6">
        <button
          onClick={onStartOver}
          className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ink"
        >
          ← Start over
        </button>
        <button
          onClick={handleDownload}
          disabled={reportLoading}
          className="rounded bg-ink px-5 py-2 font-mono text-xs uppercase tracking-wide text-paper transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          {reportLoading ? "Building PDF..." : "Download PDF report"}
        </button>
      </div>
    </div>
  );
}
