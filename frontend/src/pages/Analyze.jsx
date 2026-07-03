import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  warmUpBackend,
  analyzeResume,
  getSuggestions,
  downloadReport,
} from "../lib/api";
import StepCard from "../components/StepCard";
import JDInput from "../components/JDInput";
import ResumeUpload from "../components/ResumeUpload";
import ScoreCard from "../components/ScoreCard";
import SuggestionsPanel from "../components/SuggestionsPanel";
import NameConfirm from "../components/NameConfirm";

export default function Analyze() {
  const navigate = useNavigate();

  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [candidateName, setCandidateName] = useState("");

  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);

  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    warmUpBackend();
  }, []);

  const canAnalyze = jdText.trim().length > 0 && resumeFile && !analyzeLoading;
  const canGenerateReport =
    analysis && candidateName.trim().length > 0 && !reportLoading;

  async function handleAnalyze() {
    setAnalyzeError(null);
    setAnalyzeLoading(true);
    setAnalysis(null);
    setSuggestions(null);
    try {
      const result = await analyzeResume(resumeFile, jdText);
      setAnalysis(result);
      setCandidateName(result.candidateName || "");
      fetchSuggestions(result);
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function fetchSuggestions(analysisResult) {
    setSuggestionsError(null);
    setSuggestionsLoading(true);
    try {
      const result = await getSuggestions({
        resumeText: analysisResult.resumeText,
        jdText,
        missingKeywords: analysisResult.missingKeywords,
        keywordScore: analysisResult.breakdown.keywordScore,
        structureDetails: analysisResult.structureDetails,
        completenessDetails: analysisResult.completenessDetails,
      });
      setSuggestions(result);
    } catch (err) {
      setSuggestionsError(err.message);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function handleGenerateReport() {
    setReportError(null);
    setReportLoading(true);
    try {
      await downloadReport({
        finalScore: analysis.finalScore,
        breakdown: analysis.breakdown,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        structureDetails: analysis.structureDetails,
        completenessDetails: analysis.completenessDetails,
        suggestions: suggestions || null,
        candidateName: candidateName.trim(),
      });
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  function handleStartOver() {
    setJdText("");
    setResumeFile(null);
    setAnalysis(null);
    setCandidateName("");
    setSuggestions(null);
    setAnalyzeError(null);
    setReportError(null);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-8 flex-1 pb-16">
        <header className="flex justify-between items-center py-8 border-b border-line mb-8">
          <div
            className="font-display font-bold text-lg cursor-pointer"
            onClick={() => navigate("/")}
          >
            resu<span className="text-brand">mo</span>
          </div>
          <button
            onClick={handleStartOver}
            className="font-mono text-[13px] text-ink/50 hover:text-ink transition"
          >
            start over
          </button>
        </header>

        <StepCard number="1" title="Job Description">
          <JDInput value={jdText} onChange={setJdText} />
        </StepCard>

        <StepCard number="2" title="Your Resume">
          <ResumeUpload file={resumeFile} onChange={setResumeFile} />
          <p className="text-xs text-ink/40 mt-3">
            Your resume text is sent to a third-party AI API to generate
            suggestions. Nothing is stored.
          </p>
        </StepCard>

        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full font-semibold text-[15.5px] bg-brand text-white py-4 rounded-xl disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            {analyzeLoading ? "Analyzing…" : "Analyze"}
          </button>
        )}
        {analyzeError && (
          <p className="text-sm text-gap mt-3">{analyzeError}</p>
        )}

        {analysis && (
          <>
            <ScoreCard analysis={analysis} />
            <SuggestionsPanel
              suggestions={suggestions}
              loading={suggestionsLoading}
              error={suggestionsError}
              onRetry={() => fetchSuggestions(analysis)}
            />
            <NameConfirm value={candidateName} onChange={setCandidateName} />

            <button
              onClick={handleGenerateReport}
              disabled={!canGenerateReport}
              className="w-full font-semibold text-base bg-brand text-white py-4 rounded-xl disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {reportLoading ? "Generating…" : "Generate Report"}
            </button>
            <p className="text-center text-xs text-ink/45 mt-3">
              Downloads a PDF. Nothing is saved on our end.
            </p>
            {reportError && (
              <p className="text-sm text-gap text-center mt-2">{reportError}</p>
            )}
          </>
        )}
      </div>

      <footer className="text-center py-8 text-sm text-ink/40">
        A project of Muhammad Usman
      </footer>
    </div>
  );
}
