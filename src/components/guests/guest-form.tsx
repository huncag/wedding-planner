"use client";

import { useState, type FormEvent } from "react";
import { PlusIcon } from "@/components/icons";
import {
  CATEGORY_OPTIONS,
  EMPTY_GUEST_DRAFT,
  RSVP_STATUS_OPTIONS,
  SIDE_OPTIONS,
  guestDraftFromParty,
  type GuestCategory,
  type GuestDraft,
  type GuestParty,
  type GuestRsvpStatus,
  type GuestSide,
} from "@/lib/guests";

const inputClass =
  "w-full rounded-xl border border-parchment bg-ivory px-3 py-2.5 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted";

export function GuestForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: GuestParty;
  onSubmit: (draft: GuestDraft) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<GuestDraft>(
    initial ? guestDraftFromParty(initial) : { ...EMPTY_GUEST_DRAFT },
  );
  const [confirmedInput, setConfirmedInput] = useState(
    initial?.confirmedCount != null ? String(initial.confirmedCount) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof GuestDraft>(
    key: K,
    value: GuestDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draft.name.trim()) {
      setError("Give the invitation group a name.");
      return;
    }

    if (!Number.isFinite(draft.partySize) || draft.partySize < 1) {
      setError("A group needs at least one person.");
      return;
    }

    const trimmedConfirmed = confirmedInput.trim();
    const confirmed = trimmedConfirmed === "" ? null : Number(trimmedConfirmed);

    if (
      confirmed !== null &&
      (!Number.isFinite(confirmed) || confirmed < 0)
    ) {
      setError("Confirmed headcount must be zero or more, or left empty.");
      return;
    }

    setBusy(true);

    try {
      const saved = await onSubmit({
        ...draft,
        name: draft.name.trim(),
        partySize: Math.max(1, Math.round(draft.partySize)),
        confirmedCount: confirmed === null ? null : Math.round(confirmed),
      });

      if (saved && !initial) {
        setDraft({ ...EMPTY_GUEST_DRAFT });
        setConfirmedInput("");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <div>
          <label htmlFor="guest-name" className={labelClass}>
            Invitation group
          </label>
          <input
            id="guest-name"
            type="text"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. Szülők - E"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="guest-size" className={labelClass}>
            People
          </label>
          <input
            id="guest-size"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={draft.partySize}
            onChange={(event) =>
              update("partySize", Number(event.target.value))
            }
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="guest-side" className={labelClass}>
            Side
          </label>
          <select
            id="guest-side"
            value={draft.side}
            onChange={(event) =>
              update("side", event.target.value as GuestSide)
            }
            className={inputClass}
          >
            {SIDE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="guest-category" className={labelClass}>
            Category
          </label>
          <select
            id="guest-category"
            value={draft.category}
            onChange={(event) =>
              update("category", event.target.value as GuestCategory)
            }
            className={inputClass}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="guest-status" className={labelClass}>
            Reply
          </label>
          <select
            id="guest-status"
            value={draft.rsvpStatus}
            onChange={(event) =>
              update("rsvpStatus", event.target.value as GuestRsvpStatus)
            }
            className={inputClass}
          >
            {RSVP_STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="guest-confirmed" className={labelClass}>
            Confirmed headcount
          </label>
          <input
            id="guest-confirmed"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={confirmedInput}
            onChange={(event) => setConfirmedInput(event.target.value)}
            placeholder="Leave empty until they reply"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="guest-invite-type" className={labelClass}>
            Invitation type
          </label>
          <input
            id="guest-invite-type"
            type="text"
            value={draft.inviteType}
            onChange={(event) => update("inviteType", event.target.value)}
            placeholder="e.g. posted, hand delivered"
            className={inputClass}
          />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-forest">
              <input
                type="checkbox"
                checked={draft.inviteSent}
                onChange={(event) =>
                  update("inviteSent", event.target.checked)
                }
                className="h-4 w-4 rounded border-parchment text-forest accent-forest"
              />
              Invite sent
            </label>
            <label className="flex items-center gap-2 text-xs text-forest">
              <input
                type="checkbox"
                checked={draft.inviteReminder}
                onChange={(event) =>
                  update("inviteReminder", event.target.checked)
                }
                className="h-4 w-4 rounded border-parchment text-forest accent-forest"
              />
              Reminder sent
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="guest-email" className={labelClass}>
            Email
          </label>
          <input
            id="guest-email"
            type="email"
            value={draft.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="guest-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="guest-phone"
            type="tel"
            value={draft.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="guest-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="guest-notes"
          value={draft.notes}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Dietary needs, links, anything to remember"
          className={`${inputClass} min-h-[4.25rem] resize-y`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-parchment/70 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-wait disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          {busy
            ? "Saving…"
            : initial
              ? "Save changes"
              : "Add invitation group"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-parchment bg-ivory px-4 py-2.5 text-sm font-medium text-forest/80 transition-colors hover:border-gold/50 hover:text-forest"
        >
          Cancel
        </button>
        <p aria-live="polite" className="text-sm text-gold-ink">
          {error ?? ""}
        </p>
      </div>
    </form>
  );
}
