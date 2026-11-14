"use client";

import { useEffect, useState } from "react";
import { WEDDING } from "@/lib/wedding";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(WEDDING.dateISO).getTime();
    const tick = () => setTimeLeft(getTimeLeft(target));

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const isWeddingDay =
    timeLeft !== null &&
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  const units = [
    { label: "Hours", value: timeLeft ? pad(timeLeft.hours) : "--" },
    { label: "Minutes", value: timeLeft ? pad(timeLeft.minutes) : "--" },
    { label: "Seconds", value: timeLeft ? pad(timeLeft.seconds) : "--" },
  ];

  return (
    <section
      role="timer"
      aria-label={`Countdown to ${WEDDING.longDateLabel} at ${WEDDING.venue}`}
      className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-8 text-ivory shadow-xl shadow-forest/10 sm:px-10 sm:py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border border-gold/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full border border-gold/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-forest-600/40 blur-2xl"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold-light">
            <span className="h-px w-6 bg-gold/60" />
            Counting down to forever
          </p>
          <p className="text-[0.65rem] uppercase tracking-[0.24em] text-ivory/50">
            {WEDDING.monthLabel}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
          <span className="font-display text-[5.5rem] leading-[0.8] tabular-nums text-ivory sm:text-[7rem]">
            {timeLeft ? timeLeft.days.toLocaleString("en-US") : "—"}
          </span>
          <span className="pb-3 font-display text-2xl text-gold-light sm:pb-5">
            {isWeddingDay ? "the day is here" : "days to go"}
          </span>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-gold/25" />
          <span className="text-[0.6rem] uppercase tracking-[0.28em] text-ivory/45">
            {WEDDING.longDateLabel}
          </span>
          <span className="h-px flex-1 bg-gold/25" />
        </div>

        <div className="mt-5 grid max-w-sm grid-cols-3 gap-3">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="rounded-xl border border-ivory/10 bg-ivory/5 px-3 py-3 text-center backdrop-blur-sm"
            >
              <span className="block font-display text-2xl tabular-nums text-ivory">
                {unit.value}
              </span>
              <span className="mt-1 block text-[0.55rem] uppercase tracking-[0.22em] text-ivory/45">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
