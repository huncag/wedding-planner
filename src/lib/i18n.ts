import en from "@/lib/translations/rsvp/en.json";
import hu from "@/lib/translations/rsvp/hu.json";
import ro from "@/lib/translations/rsvp/ro.json";
import type { MealPreference } from "@/lib/rsvp";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hu", label: "Magyar", short: "HU" },
  { code: "ro", label: "Română", short: "RO" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

/** Cookie the public RSVP page uses to remember the chosen language. */
export const LANGUAGE_COOKIE = "rsvp_language";

export function isLanguage(value: string | undefined | null): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

/**
 * Plural forms a language can use. `Intl.PluralRules` picks the right one for
 * the count, so Romanian can say "2 persoane" and "20 de persoane".
 */
export type PluralForms = {
  one: string;
  few?: string;
  other: string;
};

export type RsvpCopy = {
  languageLabel: string;
  venueLine: string;
  saveTheDate: string;
  longDate: string;
  ceremonyLine: string;
  kindlyReply: string;
  willYouJoin: string;
  intro: string;
  footer: string;
  form: {
    nameLabel: string;
    namePlaceholder: string;
    contactLegend: string;
    contactHint: string;
    emailLabel: string;
    phoneLabel: string;
    attendanceLegend: string;
    acceptTitle: string;
    acceptNote: string;
    declineTitle: string;
    declineNote: string;
    peopleLegend: string;
    peopleHint: string;
    personNameLabel: string;
    personNamePlaceholder: string;
    mealLabel: string;
    mealPlaceholder: string;
    addPerson: string;
    removePerson: string;
    dietaryLabel: string;
    dietaryPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    privacy: string;
    errors: {
      nameRequired: string;
      contactRequired: string;
      invalidEmail: string;
      attendanceRequired: string;
      personNameRequired: string;
      mealRequired: string;
      saveFailed: string;
      networkFailed: string;
    };
  };
  success: {
    thankYou: string;
    attendingBody: string;
    partyHeading: string;
    partySize: PluralForms;
    declinedBody: string;
    next: string;
    sendAnother: string;
  };
  meals: Record<MealPreference, string>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Overlays a translation on the English source. Missing or blank values keep
 * the English text, so a half-finished translation never leaves gaps on the
 * page and a renamed key simply falls back.
 */
function mergeCopy(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    if (typeof override === "string" && override.trim() !== "") {
      return override;
    }

    return base;
  }

  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in base ? mergeCopy(base[key], value) : value;
  }

  return merged;
}

const EN: RsvpCopy = en;

export const RSVP_COPY: Record<Language, RsvpCopy> = {
  en: EN,
  hu: mergeCopy(EN, hu) as RsvpCopy,
  ro: mergeCopy(EN, ro) as RsvpCopy,
};

export function rsvpCopy(language: Language): RsvpCopy {
  return RSVP_COPY[language] ?? EN;
}

/**
 * Picks the plural form for `count` in the chosen language, e.g. Romanian
 * "1 persoană", "2 persoane", "20 de persoane". Languages without a `few` form
 * fall back to `other`.
 */
export function pluralize(
  forms: PluralForms,
  count: number,
  language: Language,
): string {
  const category = new Intl.PluralRules(language).select(count);
  const template =
    category === "one" || category === "few"
      ? (forms[category] ?? forms.other)
      : forms.other;

  return fill(template, { count });
}

/** Replaces `{name}`-style placeholders in a translated string. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
