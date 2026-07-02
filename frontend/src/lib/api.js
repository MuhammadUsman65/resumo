const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // response wasn't JSON, fall back to the generic message
    }
    throw new Error(detail);
  }
  return res.json();
}

export function pingHealth() {
  // fire-and-forget warm-up call for Render's cold start, ok if it fails
  fetch(`${API_URL}/health`).catch(() => {});
}

export async function ocrImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/ocr`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function analyzeResume(resumeFile, jdText) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jdText", jdText);
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function getSuggestions(payload) {
  const res = await fetch(`${API_URL}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function downloadReport(payload) {
  const res = await fetch(`${API_URL}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = `Report generation failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore, use the generic message
    }
    throw new Error(detail);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resumo_report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
