"use client";

import { useEffect, useRef, useState } from "react";

interface ResumeInfo {
  file_name: string;
  profile: { name?: string; school?: string; degree?: string; grad_date?: string; summary?: string };
}

// Upload bar + the user's own resume (private to them) + editable skills.
export function ResumeCard({
  skills,
  onSkillsChange,
}: {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
}) {
  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<null | "upload" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/resume")
      .then((res) => res.json())
      .then((data) => setResume(data.resume ?? null))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.type !== "application/pdf") return setError("Please upload your resume as a PDF.");
    setBusy("upload");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/resume", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Upload failed. Try again.");
      setResume(data.resume);
      if (Array.isArray(data.skills) && data.skills.length) onSkillsChange(data.skills);
    } catch {
      setError("Network error, try again.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm("Delete your resume from Trojan JobMatch? Your skills and AI analyses will be cleared too.")) return;
    setBusy("delete");
    await fetch("/api/resume", { method: "DELETE" }).catch(() => undefined);
    setResume(null);
    onSkillsChange([]);
    setBusy(null);
  }

  const fileInput = (
    <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
  );

  return (
    <section className="card p-4 sm:p-5">
      {fileInput}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-[18px]">Your resume</h2>
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-[var(--muted)] sm:inline">Private to your account</span>
          <a href="/resume-builder" className="rounded-full bg-[var(--gold)] px-3.5 py-2 text-[13px] font-bold text-black">✍️ Build my resume</a>
        </div>
      </div>

      {!loaded ? (
        <p className="mt-3 text-[15px] text-[var(--muted)]">Loading…</p>
      ) : !resume || busy === "upload" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files?.[0]);
          }}
          className={`mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-7 text-center ${
            dragging ? "border-[var(--cardinal)] bg-[#fff5f5]" : "border-[#c9c9cc] bg-[var(--background)]"
          }`}
        >
          {busy === "upload" ? (
            <>
              <span className="text-[16px] font-semibold">Resume Reader agent is reading your resume…</span>
              <span className="text-[14px] text-[var(--muted)]">Pulling out your skills, education and projects (about 10 seconds)</span>
            </>
          ) : (
            <>
              <span className="text-[16px] font-semibold">Upload your resume (PDF)</span>
              <span className="text-[14px] text-[var(--muted)]">Drop it here or click. AI reads it and scores every job against it.</span>
            </>
          )}
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">📄 {resume.file_name}</p>
            <p className="text-[14px] text-[var(--muted)]">
              {[resume.profile.degree, resume.profile.school, resume.profile.grad_date].filter(Boolean).join(" · ") || "Resume on file"}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy !== null} onClick={() => inputRef.current?.click()} className="btn btn-secondary min-h-[40px] px-4 text-[14px]">
              Replace
            </button>
            <button type="button" disabled={busy !== null} onClick={remove} className="btn btn-secondary min-h-[40px] px-4 text-[14px]">
              {busy === "delete" ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[14px] text-[var(--danger)]">{error}</p>}

      {skills.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <h3 className="text-[15px] font-semibold">Skills from your resume</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s} className="rounded-full bg-[var(--background)] px-3 py-1 text-[13px] font-medium">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
