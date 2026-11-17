"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import {
  MEAL_OPTIONS,
  encodePeopleFallback,
  type MealPreference,
  type RsvpPerson,
} from "@/lib/rsvp";
import { rsvpCopy, fill, type Language } from "@/lib/i18n";
import { WEDDING } from "@/lib/wedding";

const inputClass =
  "w-full rounded-xl border border-parchment bg-ivory px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted";

const MAX_PEOPLE = 20;

type Attendance = "" | "yes" | "no";

type Confirmation = {
  name: string;
  attending: boolean;
  people: RsvpPerson[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyPerson(): RsvpPerson {
  return { name: "", meal: null };
}

/** PostgREST reports a column missing from the schema cache with this shape. */
function isMissingPeopleColumn(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) {
    return false;
  }

  const message = (error.message ?? "").toLowerCase();

  return (
    error.code === "PGRST204" ||
    (message.includes("people") &&
      (message.includes("column") || message.includes("schema cache")))
  );
}

export function RsvpForm({ language }: { language: Language }) {
  const copy = rsvpCopy(language);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("");
  const [people, setPeople] = useState<RsvpPerson[]>([emptyPerson()]);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const resetFields = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAttendance("");
    setPeople([emptyPerson()]);
    setDietary("");
    setMessage("");
    setCompany("");
    setError(null);
  };

  const handleHostNameChange = (value: string) => {
    // Keep the first attendee in step with the host name until it is edited.
    setPeople((current) =>
      current.map((person, index) =>
        index === 0 && (person.name === "" || person.name === name)
          ? { ...person, name: value }
          : person,
      ),
    );
    setName(value);
  };

  const updatePerson = (index: number, patch: Partial<RsvpPerson>) => {
    setPeople((current) =>
      current.map((person, position) =>
        position === index ? { ...person, ...patch } : person,
      ),
    );
    setError(null);
  };

  const addPerson = () => {
    setPeople((current) =>
      current.length >= MAX_PEOPLE ? current : [...current, emptyPerson()],
    );
    setError(null);
  };

  const removePerson = (index: number) => {
    setPeople((current) =>
      current.length <= 1
        ? current
        : current.filter((_, position) => position !== index),
    );
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const errors = copy.form.errors;

    // Hidden field: real guests never fill this in. Pretend it worked so bots
    // do not learn how to get past the check.
    if (company.trim()) {
      setConfirmation({
        name: name.trim() || "friend",
        attending: attendance === "yes",
        people: attendance === "yes" ? people : [],
      });
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedDietary = dietary.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError(errors.nameRequired);
      return;
    }

    if (!trimmedEmail && !trimmedPhone) {
      setError(errors.contactRequired);
      return;
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setError(errors.invalidEmail);
      return;
    }

    if (!attendance) {
      setError(errors.attendanceRequired);
      return;
    }

    const attending = attendance === "yes";

    let attendees: RsvpPerson[] = [];

    if (attending) {
      const named = people.map((person, index) => ({
        name: person.name.trim() || (index === 0 ? trimmedName : ""),
        meal: person.meal,
      }));

      if (named.some((person) => !person.name && person.meal)) {
        setError(errors.personNameRequired);
        return;
      }

      attendees = named.filter((person) => person.name.length > 0);

      if (attendees.length === 0) {
        attendees = [{ name: trimmedName, meal: null }];
      }

      if (attendees.some((person) => !person.meal)) {
        setError(errors.mealRequired);
        return;
      }
    }

    setPending(true);

    try {
      const supabase = createClient();
      const base = {
        name: trimmedName,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        attending,
        party_size: attending ? attendees.length : 1,
        meal_preference: attending ? attendees[0].meal : null,
        dietary_restrictions:
          attending && trimmedDietary ? trimmedDietary : null,
        plus_one_name:
          attending && attendees.length > 1
            ? attendees
                .slice(1)
                .map((person) => person.name)
                .join(", ")
            : null,
        message: trimmedMessage || null,
      };

      const firstAttempt = await supabase
        .from("rsvp_submissions")
        .insert({ ...base, people: attending ? attendees : null });
      let saved = !firstAttempt.error;

      // The project may not have run `supabase/rsvp-people.sql` yet. Keep every
      // attendee and meal by carrying the list inside `plus_one_name` instead.
      if (!saved && isMissingPeopleColumn(firstAttempt.error)) {
        const retry = await supabase.from("rsvp_submissions").insert({
          ...base,
          plus_one_name: attending
            ? encodePeopleFallback(attendees)
            : null,
        });

        saved = !retry.error;
      }

      if (!saved) {
        setError(errors.saveFailed);
        setPending(false);
        return;
      }

      setConfirmation({
        name: trimmedName,
        attending,
        people: attending ? attendees : [],
      });
      setPending(false);
    } catch {
      setError(errors.networkFailed);
      setPending(false);
    }
  };

  if (confirmation) {
    const firstName = confirmation.name.split(/\s+/)[0] ?? confirmation.name;
    const partySize =
      confirmation.people.length > 0 ? confirmation.people.length : 1;

    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-forest/15 bg-cream/50 p-6 text-center sm:p-8"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-ivory text-forest">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-3xl leading-tight text-forest">
          {fill(copy.success.thankYou, { name: firstName })}
        </h2>
        {confirmation.attending ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-forest/80">
              {fill(copy.success.attendingBody, {
                venue: WEDDING.venue,
                date: copy.longDate,
              })}
            </p>

            <div className="mt-5 rounded-xl border border-parchment/80 bg-ivory/80 p-4 text-left">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted">
                  {copy.success.partyHeading}
                </p>
                <p className="text-xs text-muted">
                  {fill(
                    partySize === 1
                      ? copy.success.partySizeOne
                      : copy.success.partySizeOther,
                    { count: partySize },
                  )}
                </p>
              </div>
              <ul className="mt-2 divide-y divide-parchment/60">
                {confirmation.people.map((person, index) => (
                  <li
                    key={`${person.name}-${index}`}
                    className="flex items-baseline justify-between gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 break-words font-medium text-forest">
                      {person.name}
                    </span>
                    <span className="shrink-0 text-muted">
                      {person.meal ? copy.meals[person.meal] : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-forest/80">
            {copy.success.declinedBody}
          </p>
        )}
        <p className="mt-5 text-xs leading-relaxed text-muted">
          {copy.success.next}
        </p>
        <button
          type="button"
          onClick={() => {
            resetFields();
            setConfirmation(null);
          }}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-forest/20 bg-ivory px-5 py-2.5 text-sm font-medium text-forest transition-colors hover:border-gold/60 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {copy.success.sendAnother}
        </button>
      </section>
    );
  }

  const attending = attendance === "yes";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
      <div>
        <label htmlFor="rsvp-name" className={labelClass}>
          {copy.form.nameLabel}
        </label>
        <input
          id="rsvp-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => handleHostNameChange(event.target.value)}
          placeholder={copy.form.namePlaceholder}
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>{copy.form.contactLegend}</legend>
        <p className="-mt-1 mb-3 text-xs text-muted">{copy.form.contactHint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rsvp-email" className={labelClass}>
              {copy.form.emailLabel}
            </label>
            <input
              id="rsvp-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rsvp-phone" className={labelClass}>
              {copy.form.phoneLabel}
            </label>
            <input
              id="rsvp-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+40 700 000 000"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>{copy.form.attendanceLegend}</legend>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "yes",
                title: copy.form.acceptTitle,
                note: copy.form.acceptNote,
              },
              {
                value: "no",
                title: copy.form.declineTitle,
                note: copy.form.declineNote,
              },
            ] as const
          ).map((option) => {
            const selected = attendance === option.value;

            return (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border px-4 py-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/40 ${
                  selected
                    ? "border-forest bg-forest/5"
                    : "border-parchment bg-ivory hover:border-gold/60"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="attendance"
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      setAttendance(option.value);
                      setError(null);
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                  />
                  <span>
                    <span className="block text-sm font-medium text-forest">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {option.note}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {attending ? (
        <div className="space-y-6 rounded-2xl border border-parchment/80 bg-cream/30 p-4 sm:p-5">
          <fieldset>
            <legend className={labelClass}>{copy.form.peopleLegend}</legend>
            <p className="-mt-1 mb-3 text-xs text-muted">
              {copy.form.peopleHint}
            </p>

            <ul className="space-y-3">
              {people.map((person, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-parchment/70 bg-ivory/60 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_auto] sm:items-end">
                    <div>
                      <label
                        htmlFor={`rsvp-person-${index}`}
                        className={labelClass}
                      >
                        {copy.form.personNameLabel}
                      </label>
                      <input
                        id={`rsvp-person-${index}`}
                        type="text"
                        autoComplete={index === 0 ? "name" : "off"}
                        value={person.name}
                        onChange={(event) =>
                          updatePerson(index, { name: event.target.value })
                        }
                        placeholder={copy.form.personNamePlaceholder}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`rsvp-person-meal-${index}`}
                        className={labelClass}
                      >
                        {copy.form.mealLabel}
                      </label>
                      <select
                        id={`rsvp-person-meal-${index}`}
                        value={person.meal ?? ""}
                        onChange={(event) =>
                          updatePerson(index, {
                            meal:
                              event.target.value === ""
                                ? null
                                : (event.target.value as MealPreference),
                          })
                        }
                        className={inputClass}
                      >
                        <option value="">{copy.form.mealPlaceholder}</option>
                        {MEAL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {copy.meals[option.value]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePerson(index)}
                      disabled={people.length === 1}
                      aria-label={`${copy.form.removePerson} ${index + 1}`}
                      title={copy.form.removePerson}
                      className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-xl border border-parchment bg-ivory text-muted transition-colors hover:border-gold/60 hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-40 sm:justify-self-auto"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={addPerson}
              disabled={people.length >= MAX_PEOPLE}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-forest/25 bg-ivory px-4 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {copy.form.addPerson}
            </button>
          </fieldset>

          <div>
            <label htmlFor="rsvp-dietary" className={labelClass}>
              {copy.form.dietaryLabel}
            </label>
            <textarea
              id="rsvp-dietary"
              rows={2}
              value={dietary}
              onChange={(event) => setDietary(event.target.value)}
              placeholder={copy.form.dietaryPlaceholder}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="rsvp-message" className={labelClass}>
          {copy.form.messageLabel}
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={copy.form.messagePlaceholder}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div
        aria-hidden
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="rsvp-company">Company</label>
        <input
          id="rsvp-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      <div className="space-y-4 border-t border-parchment/70 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? copy.form.submitting : copy.form.submit}
        </button>

        <p
          role={error ? "alert" : undefined}
          aria-live="polite"
          className={`min-h-5 text-sm ${error ? "text-gold-ink" : "text-muted"}`}
        >
          {error ?? copy.form.privacy}
        </p>
      </div>
    </form>
  );
}
