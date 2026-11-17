"use server";

import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, isLanguage } from "@/lib/i18n";

/** Remembers the public RSVP language for a year. */
export async function setLanguageAction(language: string): Promise<void> {
  if (!isLanguage(language)) {
    return;
  }

  const store = await cookies();
  store.set(LANGUAGE_COOKIE, language, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
