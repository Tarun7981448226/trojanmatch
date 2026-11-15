"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Google's own "Sign in with Google" button (Google Identity Services).
// Renders nothing until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set, so the page
// still works before the Google client id exists.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleId {
  initialize: (options: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export function GoogleButton() {
  const router = useRouter();
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    const render = () => {
      const google = window.google;
      if (!google || !holder.current) return;
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          setError(null);
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential }),
          });
          if (res.ok) router.push("/dashboard");
          else setError((await res.json().catch(() => ({}))).error ?? "Google sign-in failed");
        },
      });
      google.accounts.id.renderButton(holder.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: holder.current.offsetWidth || 390,
      });
    };
    if (window.google) return render();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [router]);

  if (!CLIENT_ID) return null;
  return (
    <div className="mt-3">
      <div ref={holder} className="flex min-h-[44px] w-full justify-center" />
      {error && <p role="alert" className="mt-2 text-[14px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
