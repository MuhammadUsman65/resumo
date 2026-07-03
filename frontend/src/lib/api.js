const BASE_URL = import.meta.env.VITE_API_URL;

async function parseErrorDetail(response) {
  try {
    const body = await response.json();
    return body.detail || response.statusText;
  } catch {
    return response.statusText;
  }
}

// Render's free tier spins down after 15 minutes idle and takes 30-60s to wake
// back up. Fire this the moment the app screen mounts (before the user's even
// finished pasting the JD) so the container is likely already warm by the
// time they hit "Analyze".
export function warmUpBackend() {
  fetch(`${BASE_URL}/health`).catch(() => {});
}

export async function ocrImage(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);
  const res = await fetch(`${BASE_URL}/api/ocr`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json(); // { extractedText }
}

export async function analyzeResume(resumeFile, jdText) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jdText", jdText);
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json();
  // { resumeText, candidateName, finalScore, breakdown, matchedKeywords,
  //   missingKeywords, structureDetails, completenessDetails }
}

export async function getSuggestions({
  resumeText,
  jdText,
  missingKeywords,
  keywordScore,
  structureDetails,
  completenessDetails,
}) {
  const res = await fetch(`${BASE_URL}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeText,
      jdText,
      missingKeywords,
      keywordScore,
      structureDetails,
      completenessDetails,
    }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json(); // { summarySuggestion, bulletSuggestions, generalTips }
}

// Triggers an actual file download — the backend returns the PDF as a
// StreamingResponse with Content-Disposition: attachment, but since this is a
// POST (not a plain link the browser can navigate to), we still have to pull
// it in as a blob and simulate a click ourselves.
export async function downloadReport(reportPayload) {
  const res = await fetch(`${BASE_URL}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportPayload),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resumo_report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
