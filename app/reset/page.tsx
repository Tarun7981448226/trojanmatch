"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";

import { AuthShell } from "@/components/auth/AuthShell";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? (res.status >= 500 ? "Our server is having trouble right now. Please try again in a minute." : "Reset failed"));
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error, try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-[14px] font-semibold">
        New password
        <input type="password" className="input font-normal" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
      </label>
      <label className="flex flex-col gap-2 text-[14px] font-semibold">
        Confirm new password
        <input type="password" className="input font-normal" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </label>
      {error && <p role="alert" className="text-[14px] text-[var(--danger)]">{error}</p>}
      <button type="submit" disabled={pending || !token} className="btn btn-primary w-full bg-[var(--cardinal-deep)]">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <AuthShell title="Choose a new password." subtitle="Then you're straight back to your matches.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
