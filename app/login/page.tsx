"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordForm } from "@/components/login/PasswordForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthShell title="Fight on. Log in." subtitle="Pick up where your last match left off.">
      <PasswordForm onSuccess={() => router.push("/dashboard")} />
      <GoogleButton />
      <div className="my-5 flex items-center gap-3 text-[13px] text-[#3a3a3c]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        New here?
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <Link href="/signup" className="btn btn-gold w-full">
        Create free account
      </Link>
    </AuthShell>
  );
}
