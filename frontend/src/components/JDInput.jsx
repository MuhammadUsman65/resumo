import { useState } from "react";
import { ocrImage } from "../lib/api";

export default function JDInput({ value, onChange }) {
  const [mode, setMode] = useState("paste"); // "paste" | "image"
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [imageName, setImageName] = useState(null);

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageName(file.name);
    setOcrError(null);
    setOcrLoading(true);
    try {
      const { extractedText } = await ocrImage(file);
      onChange(extractedText);
    } catch (err) {
      setOcrError(err.message);
    } finally {
      setOcrLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-3.5">
        <TabButton active={mode === "paste"} onClick={() => setMode("paste")}>
          Paste text
        </TabButton>
        <TabButton active={mode === "image"} onClick={() => setMode("image")}>
          Upload image
        </TabButton>
      </div>

      {mode === "image" && (
        <div className="mb-3.5">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-brand cursor-pointer border-[1.5px] border-dashed border-line rounded-lg px-4 py-3 hover:border-brand transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {imageName
              ? `Change image (${imageName})`
              : "Choose an image of the job posting"}
          </label>
          {ocrLoading && (
            <p className="text-xs text-ink/50 mt-2 font-mono">
              Extracting text…
            </p>
          )}
          {ocrError && <p className="text-xs text-gap mt-2">{ocrError}</p>}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          mode === "image"
            ? "Extracted text will appear here — check it over before analyzing"
            : "Paste the job description here…"
        }
        rows={8}
        className="w-full border-[1.5px] border-line rounded-lg p-4 text-sm font-body leading-relaxed focus:outline-none focus:border-brand transition resize-none"
      />
      {mode === "image" && value && (
        <p className="text-xs text-ink/45 mt-2">
          Double-check the text above — OCR isn't perfect. Fix anything that
          looks wrong before analyzing.
        </p>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-[13px] font-medium px-3.5 py-1.5 rounded-full font-mono transition " +
        (active
          ? "bg-ink text-white"
          : "bg-white border-[1.5px] border-line text-ink/60 hover:border-ink/30")
      }
    >
      {children}
    </button>
  );
}
