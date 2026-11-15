import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy · Trojan JobMatch" };

export default function PrivacyPage() {
  return (
    <main className="container-tm py-12">
      <h1 className="font-heading text-[32px]">Privacy</h1>
      <div className="mt-6 flex max-w-[680px] flex-col gap-4 text-[16px] leading-relaxed">
        <p>Trojan JobMatch is a student project built for USC students. Here is what we keep and why.</p>
        <p><strong>Your account:</strong> your name, email, optional phone, department and photo. Passwords are stored only as bcrypt hashes.</p>
        <p><strong>Your resume:</strong> stored privately under your account and used only to match and analyze jobs for you. No other student can see it. Delete it any time from the dashboard.</p>
        <p><strong>AI:</strong> when you ask for an analysis, the relevant parts of your resume and the job are sent to Google&apos;s Gemini API to produce the answer. The AI is told never to invent facts about you.</p>
        <p><strong>Chats</strong> with the JobMatch Agent are not stored; they disappear when you close the tab, sign out or type /clear.</p>
        <p><strong>We never</strong> sell your data, share it with employers, or apply to jobs for you.</p>
        <p>
          <Link href="/login" className="font-semibold text-[var(--cardinal)] underline">Back to Trojan JobMatch</Link>
        </p>
      </div>
    </main>
  );
}
