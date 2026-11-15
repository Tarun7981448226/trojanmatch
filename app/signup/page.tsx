"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";

// Common codes for USC students; the number is sent as code + digits.
const COUNTRY_CODES = [
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+52", label: "🇲🇽 +52" },
  { code: "+55", label: "🇧🇷 +55" },
  { code: "+234", label: "🇳🇬 +234" },
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [countryCode, setCountryCode] = useState("+1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone.trim() ? `${countryCode}${form.phone.replace(/\D/g, "")}` : "",
        }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? (res.status >= 500 ? "Our server is having trouble right now. Please try again in a minute." : "Sign-up failed"));
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
    <AuthShell title="Join the match." subtitle="Free for every Trojan. Takes a minute.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-[14px] font-semibold">
          Full name
          <input className="input font-normal" autoComplete="name" value={form.name} onChange={set("name")} required autoFocus />
        </label>
        <label className="flex flex-col gap-2 text-[14px] font-semibold">
          Email
          <input type="email" className="input font-normal" autoComplete="email" placeholder="you@usc.edu" value={form.email} onChange={set("email")} required />
        </label>
        <div className="flex flex-col gap-2 text-[14px] font-semibold">
          <label htmlFor="phone">
            Phone number <span className="font-normal text-[var(--muted)]">(optional)</span>
          </label>
          <div className="grid grid-cols-[1fr_112px] gap-2">
            <input id="phone" type="tel" className="input font-normal" autoComplete="tel-national" placeholder="213 555 1234" value={form.phone} onChange={set("phone")} />
            <select
              aria-label="Country code"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="input px-2 font-normal"
            >
              {COUNTRY_CODES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex flex-col gap-2 text-[14px] font-semibold">
          Password
          <input type="password" className="input font-normal" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} required minLength={8} />
        </label>
        {error && <p role="alert" className="text-[14px] text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full bg-[var(--cardinal-deep)]">
          {pending ? "Creating account…" : "Create free account"}
        </button>
      </form>
      <GoogleButton />
      <p className="mt-5 text-center text-[15px]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--cardinal)] underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
