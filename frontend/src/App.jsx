import { useEffect, useState } from "react";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import JDInput from "./components/JDInput";
import ResumeUpload from "./components/ResumeUpload";
import ResultsView from "./components/ResultsView";
import { analyzeResume, pingHealth } from "./lib/api";
import { ErrorBanner } from "./components/StatusMessage";

export default function App() {
  const [step, setStep] = useState(1);
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pingHealth();
  }, []);

  async function handleAnalyze() {
    setError("");
    setAnalyzing(true);
    try {
      const result = await analyzeResume(resumeFile, jdText);
      setAnalysis(result);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleStartOver() {
    setStep(1);
    setJdText("");
    setResumeFile(null);
    setAnalysis(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {step === 1 && (
          <JDInput
            jdText={jdText}
            onChange={setJdText}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ResumeUpload
            file={resumeFile}
            onChange={setResumeFile}
            onBack={() => setStep(1)}
            onAnalyze={handleAnalyze}
            loading={analyzing}
          />
        )}

        {step === 3 && analysis && (
          <ResultsView
            analysis={analysis}
            jdText={jdText}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
