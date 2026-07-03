export default function ResumeUpload({ file, onChange }) {
  function handleChange(e) {
    const f = e.target.files[0];
    if (f) onChange(f);
  }

  return (
    <label className="flex items-center justify-between gap-4 border-[1.5px] border-dashed border-line rounded-lg px-5 py-6 cursor-pointer hover:border-brand transition">
      <div>
        <div className="font-display font-semibold text-sm mb-1">
          {file ? file.name : "Upload your resume"}
        </div>
        <div className="text-xs text-ink/45">PDF or DOCX — not legacy .doc</div>
      </div>
      <span className="text-brand text-sm font-medium font-mono shrink-0">
        {file ? "Change" : "Browse \u2192"}
      </span>
      <input
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}
