"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

export function PasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? (response.status >= 500 ? "Our server is having trouble right now. Please try again in a minute." : "Login failed"));
        return;
      }
      onSuccess();
    } catch {
      setError("Network error, try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <label className="flex flex-col gap-2 text-[14px] font-semibold">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input font-normal"
          placeholder="you@usc.edu"
          required
          autoFocus
        />
      </label>
      <label className="mt-4 flex flex-col gap-2 text-[14px] font-semibold">
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input font-normal"
          placeholder="Password"
          required
        />
      </label>
      <div className="mt-5 flex items-center justify-between gap-4 text-[14px]">
        <label className="flex min-h-[44px] items-center gap-3">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-[18px] w-[18px] accent-[var(--cardinal)]"
          />
          Keep me logged in
        </label>
        <Link href="/forgot" className="font-semibold text-[var(--cardinal)] underline underline-offset-2">
          Forgot password?
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[14px] text-[var(--danger)]">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-4 w-full bg-[var(--cardinal-deep)]">
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
