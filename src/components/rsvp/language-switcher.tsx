"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguageAction } from "@/lib/actions/language";
import { LANGUAGES, type Language } from "@/lib/i18n";

export function LanguageSwitcher({
  language,
  label,
}: {
  language: Language;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (code: Language) => {
    if (code === language) {
      return;
    }

    startTransition(async () => {
      await setLanguageAction(code);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className={`inline-flex items-center gap-1 rounded-full border border-parchment bg-ivory p-1 ${
          pending ? "opacity-70" : ""
        }`}
      >
        {LANGUAGES.map((option) => {
          const selected = option.code === language;

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => choose(option.code)}
              aria-pressed={selected}
              title={option.label}
              className={`rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
                selected
                  ? "bg-forest text-ivory"
                  : "text-forest/70 hover:bg-cream hover:text-forest"
              }`}
            >
              {option.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
