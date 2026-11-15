"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "sent" | "email-off">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("pending");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setState("idle");
      } else {
        setState(data.reason === "email-off" ? "email-off" : "sent");
      }
    } catch {
      setError("Network error, try again");
      setState("idle");
    }
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="We'll email you a link to choose a new one.">
      {state === "sent" ? (
        <p className="rounded-xl bg-[#f4f4f2] p-4 text-[15px]">
          If an account exists for <b>{email}</b>, a reset link is on its way. It works for 30 minutes.
        </p>
      ) : state === "email-off" ? (
        <p className="rounded-xl bg-[#f4f4f2] p-4 text-[15px]">
          Password emails aren&rsquo;t switched on yet. Ask a Trojan JobMatch organizer to reset your account.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-[14px] font-semibold">
            Email
            <input type="email" className="input font-normal" autoComplete="email" placeholder="you@usc.edu" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          {error && <p role="alert" className="text-[14px] text-[var(--danger)]">{error}</p>}
          <button type="submit" disabled={state === "pending"} className="btn btn-primary w-full bg-[var(--cardinal-deep)]">
            {state === "pending" ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-[15px]">
        <Link href="/login" className="font-semibold text-[var(--cardinal)] underline underline-offset-2">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
