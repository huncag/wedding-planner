import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { CalendarIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/rsvp/language-switcher";
import { RsvpForm } from "@/components/rsvp/rsvp-form";
import {
  LANGUAGE_COOKIE,
  isLanguage,
  rsvpCopy,
  type Language,
} from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: "RSVP · Teleki Castle" },
  description:
    "Reply to our wedding invitation for Teleki Castle in Gernyeszeg, Romania.",
  robots: { index: false, follow: false },
};

// The page reads the saved language from cookies, so it renders per request.
export const instant = false;

/** Uses the saved choice, then the browser's preferred language. */
async function resolveLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LANGUAGE_COOKIE)?.value;

  if (isLanguage(stored)) {
    return stored;
  }

  const headerStore = await headers();
  const accepted = (headerStore.get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "");

  if (accepted.some((tag) => tag.startsWith("hu"))) {
    return "hu";
  }

  if (accepted.some((tag) => tag.startsWith("ro"))) {
    return "ro";
  }

  return "en";
}

export default async function RsvpPage() {
  const language = await resolveLanguage();
  const copy = rsvpCopy(language);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream/50 px-5 py-12 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full border border-gold/15" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full border border-gold/15" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <article
        lang={language}
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-parchment bg-ivory/95 shadow-[0_24px_80px_-32px_rgba(20,54,79,0.28)]"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="px-6 py-10 sm:px-12 sm:py-14">
          <div className="mb-7 flex justify-center">
            <LanguageSwitcher language={language} label={copy.languageLabel} />
          </div>

          <header className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-cream/60 text-forest">
              <span className="font-display text-xl leading-none tracking-tight">
                E&amp;H
              </span>
            </span>

            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.34em] text-gold-ink">
              {copy.venueLine}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-forest sm:text-5xl">
              {copy.saveTheDate}
            </h1>
            <p className="mt-5 font-display text-2xl text-forest/90 sm:text-3xl">
              {copy.longDate}
            </p>
            <p className="mt-1 text-sm text-muted">{copy.ceremonyLine}</p>

            <div className="my-8 flex items-center justify-center gap-3 text-gold/70">
              <span className="h-px w-16 bg-current" />
              <span className="h-1.5 w-1.5 rotate-45 border border-current" />
              <span className="h-px w-16 bg-current" />
            </div>
          </header>

          <section
            aria-labelledby="rsvp-heading"
            className="rounded-2xl border border-parchment/80 bg-white/60 p-5 sm:p-7"
          >
            <p className="flex items-center gap-2 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-muted">
              <CalendarIcon className="h-3.5 w-3.5 text-gold" />
              {copy.kindlyReply}
            </p>
            <h2
              id="rsvp-heading"
              className="mt-3 font-display text-3xl leading-tight text-forest"
            >
              {copy.willYouJoin}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-forest/75">
              {copy.intro}
            </p>

            <div className="mt-6">
              <RsvpForm language={language} />
            </div>
          </section>

          <p className="mt-8 text-center text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted">
            {copy.footer}
          </p>
        </div>
      </article>
    </main>
  );
}
