"use client";

import { useEffect, useRef, useState } from "react";

export interface Profile {
  name: string;
  email: string;
  department: string;
  photo: string | null;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

// Shrinks a picked photo to a 256px square JPEG in the browser, so only a
// small image is ever stored.
async function toSmallJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const side = Math.min(bitmap.width, bitmap.height);
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function Avatar({ profile, size }: { profile: Profile; size: number }) {
  return profile.photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- user's own data URL
    <img src={profile.photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-[var(--gold)]" style={{ width: size, height: size }} />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--gold)] font-bold text-black ring-2 ring-white/40"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(profile.name)}
    </span>
  );
}

export function ProfileMenu({
  profile,
  onChange,
  onSignOut,
}: {
  profile: Profile;
  onChange: (next: Partial<Profile>) => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState(profile.department);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function save(patch: Partial<Profile>) {
    setError(null);
    const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (res.ok) onChange(patch);
    else setError((await res.json().catch(() => ({}))).error ?? "Couldn't save");
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    try {
      await save({ photo: await toSmallJpeg(file) });
    } catch {
      setError("Couldn't read that image");
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setDept(profile.department);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className="flex min-h-[44px] items-center gap-3 rounded-full py-1 pl-1 pr-1 text-left hover:bg-white/10 sm:pr-4"
      >
        <Avatar profile={profile} size={40} />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[220px] truncate text-[15px] font-semibold leading-tight">{profile.name}</span>
          <span className="block max-w-[220px] truncate text-[13px] leading-tight text-white/75">
            {profile.department || profile.email}
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(320px,calc(100vw-32px))] rounded-2xl bg-white p-4 text-[var(--foreground,#1d1d1f)] shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          <div className="flex items-center gap-3">
            <Avatar profile={profile} size={56} />
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-black">{profile.name}</p>
              <p className="truncate text-[14px] text-[var(--muted)]">{profile.email}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary min-h-[36px] flex-1 px-3 text-[13px] text-black">
              {profile.photo ? "Change photo" : "Add photo"}
            </button>
            {profile.photo && (
              <button type="button" onClick={() => save({ photo: null })} className="btn btn-secondary min-h-[36px] px-3 text-[13px] text-black">
                Remove
              </button>
            )}
          </div>
          <label className="mt-4 flex flex-col gap-1.5 text-[13px] font-semibold text-black">
            Department / major
            <div className="flex gap-2">
              <input
                className="input min-h-[40px] text-[15px] font-normal"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="e.g. MS Computer Science, Viterbi"
              />
              <button type="button" onClick={() => save({ department: dept })} className="btn btn-primary min-h-[40px] bg-[var(--cardinal-deep)] px-3 text-[13px]">
                Save
              </button>
            </div>
          </label>
          {error && <p className="mt-2 text-[13px] text-[var(--danger)]">{error}</p>}
          <button type="button" onClick={onSignOut} className="btn btn-secondary mt-4 min-h-[40px] w-full text-[14px] text-black">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
