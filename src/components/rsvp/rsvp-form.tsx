"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import {
  MEAL_OPTIONS,
  mealLabel,
  type MealPreference,
} from "@/lib/rsvp";
import { WEDDING } from "@/lib/wedding";

const inputClass =
  "w-full rounded-xl border border-parchment bg-ivory px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted";

type Attendance = "" | "yes" | "no";

type Confirmation = {
  name: string;
  attending: boolean;
  meal: MealPreference | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RsvpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("");
  const [meal, setMeal] = useState<MealPreference | "">("");
  const [plusOne, setPlusOne] = useState("");
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
    setMeal("");
    setPlusOne("");
    setDietary("");
    setMessage("");
    setCompany("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Hidden field: real guests never fill this in. Pretend it worked so bots
    // do not learn how to get past the check.
    if (company.trim()) {
      setConfirmation({
        name: name.trim() || "friend",
        attending: attendance === "yes",
        meal: meal || null,
      });
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPlusOne = plusOne.trim();
    const trimmedDietary = dietary.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError("Please tell us your name.");
      return;
    }

    if (!trimmedEmail && !trimmedPhone) {
      setError("Add an email address or a phone number so we can reach you.");
      return;
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setError("That email address does not look right.");
      return;
    }

    if (!attendance) {
      setError("Please let us know whether you can join us.");
      return;
    }

    const attending = attendance === "yes";

    if (attending && !meal) {
      setError("Please choose a meal so we can plan the menu.");
      return;
    }

    setPending(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("rsvp_submissions")
        .insert({
          name: trimmedName,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
          attending,
          meal_preference: attending && meal ? meal : null,
          dietary_restrictions: attending && trimmedDietary ? trimmedDietary : null,
          plus_one_name: attending && trimmedPlusOne ? trimmedPlusOne : null,
          message: trimmedMessage || null,
        });

      if (insertError) {
        setError(
          "We could not save your reply. Please try again in a moment, or send us a message directly.",
        );
        setPending(false);
        return;
      }

      setConfirmation({
        name: trimmedName,
        attending,
        meal: attending && meal ? meal : null,
      });
      setPending(false);
    } catch {
      setError(
        "We could not reach the RSVP service. Check your connection and try again.",
      );
      setPending(false);
    }
  };

  if (confirmation) {
    const firstName = confirmation.name.split(/\s+/)[0] ?? confirmation.name;

    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-forest/15 bg-cream/50 p-6 text-center sm:p-8"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-ivory text-forest">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-3xl leading-tight text-forest">
          Thank you, {firstName}
        </h2>
        {confirmation.attending ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-forest/80">
              Your reply is with us. We cannot wait to celebrate with you at{" "}
              {WEDDING.venue} on {WEDDING.longDateLabel}.
            </p>
            {confirmation.meal ? (
              <p className="mt-3 text-sm text-muted">
                Meal chosen:{" "}
                <span className="font-medium text-forest">
                  {mealLabel(confirmation.meal)}
                </span>
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-forest/80">
            We are sorry you cannot make it, but thank you for letting us know.
            You will be missed.
          </p>
        )}
        <p className="mt-5 text-xs leading-relaxed text-muted">
          Plans changed? Send another reply or get in touch with us directly and
          we will update your place.
        </p>
        <button
          type="button"
          onClick={() => {
            resetFields();
            setConfirmation(null);
          }}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-forest/20 bg-ivory px-5 py-2.5 text-sm font-medium text-forest transition-colors hover:border-gold/60 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          Send another reply
        </button>
      </section>
    );
  }

  const attending = attendance === "yes";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
      <div>
        <label htmlFor="rsvp-name" className={labelClass}>
          Your name
        </label>
        <input
          id="rsvp-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="First and last name"
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>How can we reach you?</legend>
        <p className="-mt-1 mb-3 text-xs text-muted">
          Give us at least one of the two so we can confirm the details.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rsvp-email" className={labelClass}>
              Email
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
              Phone
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
        <legend className={labelClass}>Will you join us?</legend>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "yes",
                title: "Joyfully accepts",
                note: `${WEDDING.longDateLabel} · ${WEDDING.ceremonyTime}`,
              },
              {
                value: "no",
                title: "Regretfully declines",
                note: "We will miss you, but thank you for telling us.",
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rsvp-meal" className={labelClass}>
                Meal preference
              </label>
              <select
                id="rsvp-meal"
                required
                value={meal}
                onChange={(event) => {
                  const value = event.target.value;
                  setMeal(
                    value === "" ? "" : (value as MealPreference),
                  );
                  setError(null);
                }}
                className={inputClass}
              >
                <option value="">Choose a meal…</option>
                {MEAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rsvp-plus-one" className={labelClass}>
                Bringing someone? (optional)
              </label>
              <input
                id="rsvp-plus-one"
                type="text"
                value={plusOne}
                onChange={(event) => setPlusOne(event.target.value)}
                placeholder="Their name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="rsvp-dietary" className={labelClass}>
              Dietary needs or allergies (optional)
            </label>
            <textarea
              id="rsvp-dietary"
              rows={2}
              value={dietary}
              onChange={(event) => setDietary(event.target.value)}
              placeholder="e.g. nut allergy, gluten free"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="rsvp-message" className={labelClass}>
          A note for us (optional)
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Anything you would like us to know"
          className={`${inputClass} resize-y`}
        />
      </div>

      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
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
          {pending ? "Sending your reply…" : "Send my reply"}
        </button>

        <p
          role={error ? "alert" : undefined}
          aria-live="polite"
          className={`min-h-5 text-sm ${error ? "text-gold-ink" : "text-muted"}`}
        >
          {error ?? "Your details are only visible to the two of us."}
        </p>
      </div>
    </form>
  );
}
