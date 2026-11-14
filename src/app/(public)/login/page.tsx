import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { LockIcon } from "@/components/icons";
import { WEDDING } from "@/lib/wedding";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Private sign-in for the wedding planner.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream/50 px-5 py-12 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full border border-gold/15" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full border border-gold/15" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <article className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-parchment bg-ivory/95 shadow-[0_24px_80px_-32px_rgba(30,58,50,0.35)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="px-6 py-9 sm:px-10 sm:py-11">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-forest font-display text-xl leading-none text-ivory shadow-sm">
            W
          </span>

          <p className="mt-6 flex items-center gap-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-gold-ink">
            <LockIcon className="h-3.5 w-3.5" />
            Private planner
          </p>
          <h1 className="mt-3 font-display text-4xl leading-none text-forest">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Sign in with the email address and password saved in Supabase.
          </p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <p className="mt-6 border-t border-parchment/70 pt-4 text-xs leading-relaxed text-muted">
            Only two accounts exist. If you need access, ask the other planner to
            add you from the Supabase dashboard.
          </p>
        </div>
      </article>

      <p className="relative mt-6 text-center text-[0.6rem] font-medium uppercase tracking-[0.26em] text-muted">
        {WEDDING.venue} · {WEDDING.longDateLabel}
      </p>
    </main>
  );
}
