import type { ReactNode } from "react";

import { BrandImage } from "@/components/brand/BrandImage";

// Tarun's split design for /login and /signup: a cardinal brand panel on
// the left (wordmark, big headline, feature pills) and the form on a white
// panel on the right. Below 734px the panels stack and the headline shrinks.
const PILLS = ["Eligibility check", "Fit score 0–100", "AI job agents"];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.45em] font-display tracking-[0.02em] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
      <img src="/brand/logo-mark.svg" alt="" className="h-[1.6em] w-[1.6em] rounded-[0.35em] ring-1 ring-white/25" />
      <span>
        TROJAN<span className="text-[var(--gold)]">JobMatch</span>
      </span>
    </span>
  );
}

export function AuthShell({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:min-h-screen sm:grid-cols-[54fr_46fr]">
      <section className="relative flex flex-col overflow-hidden bg-[var(--cardinal-deep)] px-6 py-8 text-white sm:px-10 sm:py-12 lg:px-14">
        {/* Tommy Trojan (Tarun's file in public/brand/), desktop only so it
            never crowds the headline on smaller screens. */}
        <BrandImage
          src="/brand/tommy-trojan.png"
          alt="Tommy Trojan"
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[78%] max-h-[640px] w-auto object-contain opacity-95 lg:block"
        />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Wordmark className="text-[20px] sm:text-[24px]" />
          <BrandImage src="/brand/usc-logo.svg" alt="USC" className="h-8 w-auto sm:h-10" />
        </div>
        <div className="relative z-10 my-8 sm:my-auto">
          <div className="mb-5 h-[6px] w-[64px] bg-[var(--gold)] sm:mb-6" />
          <h2 className="font-display text-[clamp(36px,5.6vw,80px)] uppercase leading-[0.98]">
            Every Trojan deserves the <span className="text-[var(--gold)]">right match.</span>
          </h2>
          <p className="mt-6 max-w-[460px] text-[16px] leading-relaxed text-white/90 sm:text-[18px]">
            Any job posting. Your resume. One honest answer on whether you qualify and how to get closer.
          </p>
        </div>
        <ul className="relative z-10 hidden flex-wrap gap-3 sm:flex">
          {PILLS.map((pill) => (
            <li
              key={pill}
              className="rounded-full border-2 border-[var(--gold)] px-4 py-2 text-[14px] font-bold text-[var(--gold)]"
            >
              {pill}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-[390px]">
          <h1 className="font-heading text-[30px] leading-tight sm:text-[34px]">{title}</h1>
          <p className="mt-1 text-[16px] text-[#3a3a3c]">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 text-center text-[13px] text-[#3a3a3c]">
            A student project built at the AI@USC Hackathon. Not an official USC website.
          </p>
        </div>
      </section>
    </div>
  );
}
