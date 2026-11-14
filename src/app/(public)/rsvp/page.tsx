import type { Metadata } from "next";
import { CalendarIcon, CastleIcon } from "@/components/icons";
import { RsvpForm } from "@/components/rsvp/rsvp-form";
import { WEDDING } from "@/lib/wedding";

export const metadata: Metadata = {
  title: { absolute: "RSVP · Teleki Castle" },
  description:
    "Reply to our wedding invitation for Teleki Castle in Gernyeszeg, Romania.",
  robots: { index: false, follow: false },
};

export default function RsvpPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream/50 px-5 py-12 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full border border-gold/15" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full border border-gold/15" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <article className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-parchment bg-ivory/95 shadow-[0_24px_80px_-32px_rgba(30,58,50,0.35)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="px-6 py-10 sm:px-12 sm:py-14">
          <header className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-cream/60 text-forest">
              <CastleIcon className="h-6 w-6" />
            </span>

            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.34em] text-gold-ink">
              {WEDDING.venue} · Gernyeszeg
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-forest sm:text-5xl">
              Save the date
            </h1>
            <p className="mt-5 font-display text-2xl text-forest/90 sm:text-3xl">
              {WEDDING.longDateLabel}
            </p>
            <p className="mt-1 text-sm text-muted">
              Ceremony at {WEDDING.ceremonyTime} · {WEDDING.location}
            </p>

            <div className="my-8 flex items-center justify-center gap-3 text-gold/70">
              <span className="h-px w-16 bg-current" />
              <span className="h-1.5 w-1.5 rotate-45 border border-current" />
              <span className="h-px w-16 bg-current" />
            </div>
          </header>

          <section aria-labelledby="rsvp-heading" className="rounded-2xl border border-parchment/80 bg-white/60 p-5 sm:p-7">
            <p className="flex items-center gap-2 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-muted">
              <CalendarIcon className="h-3.5 w-3.5 text-gold" />
              Kindly reply
            </p>
            <h2
              id="rsvp-heading"
              className="mt-3 font-display text-3xl leading-tight text-forest"
            >
              Will you join us?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-forest/75">
              Please send your reply as soon as you know — it helps us plan the
              menu, seating and every last detail. Replies appear in our planner
              the moment they are sent.
            </p>

            <div className="mt-6">
              <RsvpForm />
            </div>
          </section>

          <p className="mt-8 text-center text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted">
            We cannot wait to celebrate with you
          </p>
        </div>
      </article>
    </main>
  );
}
