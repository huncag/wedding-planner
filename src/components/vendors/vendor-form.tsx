"use client";

import { useState, type FormEvent } from "react";
import { PlusIcon } from "@/components/icons";
import {
  EMPTY_VENDOR_DRAFT,
  VENDOR_CATEGORY_SUGGESTIONS,
  VENDOR_STATUS_OPTIONS,
  draftFromVendor,
  type Vendor,
  type VendorDraft,
  type VendorStatus,
} from "@/lib/vendors";

const inputClass =
  "w-full rounded-xl border border-parchment bg-ivory px-3 py-2.5 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted";

const areaClass = `${inputClass} min-h-[4.25rem] resize-y`;

export function VendorForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Vendor;
  onSubmit: (draft: VendorDraft) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<VendorDraft>(
    initial ? draftFromVendor(initial) : { ...EMPTY_VENDOR_DRAFT },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof VendorDraft>(
    key: K,
    value: VendorDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draft.name.trim()) {
      setError("Give the vendor a name.");
      return;
    }

    if (!draft.category.trim()) {
      setError("Pick or type a category.");
      return;
    }

    setBusy(true);

    try {
      const saved = await onSubmit(draft);

      if (saved && !initial) {
        setDraft({ ...EMPTY_VENDOR_DRAFT });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vendor-name" className={labelClass}>
            Vendor
          </label>
          <input
            id="vendor-name"
            type="text"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. Project X"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vendor-category" className={labelClass}>
            Category
          </label>
          <input
            id="vendor-category"
            type="text"
            list="vendor-category-options"
            value={draft.category}
            onChange={(event) => update("category", event.target.value)}
            placeholder="e.g. Zene"
            className={inputClass}
          />
          <datalist id="vendor-category-options">
            {VENDOR_CATEGORY_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="vendor-handled-by" className={labelClass}>
            Handled by
          </label>
          <input
            id="vendor-handled-by"
            type="text"
            value={draft.handledBy}
            onChange={(event) => update("handledBy", event.target.value)}
            placeholder="Huni / Eszter"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vendor-contact" className={labelClass}>
            Contact
          </label>
          <input
            id="vendor-contact"
            type="text"
            value={draft.contactInfo}
            onChange={(event) => update("contactInfo", event.target.value)}
            placeholder="Name, phone or email"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vendor-status" className={labelClass}>
            Status
          </label>
          <select
            id="vendor-status"
            value={draft.status}
            onChange={(event) => {
              if (
                VENDOR_STATUS_OPTIONS.some(
                  (option) => option.id === event.target.value,
                )
              ) {
                update("status", event.target.value as VendorStatus);
              }
            }}
            className={inputClass}
          >
            {VENDOR_STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vendor-price" className={labelClass}>
            Price or quote
          </label>
          <input
            id="vendor-price"
            type="text"
            value={draft.priceNote}
            onChange={(event) => update("priceNote", event.target.value)}
            placeholder="e.g. 15000 + 2500 RON"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vendor-offer" className={labelClass}>
            Offer summary
          </label>
          <input
            id="vendor-offer"
            type="text"
            value={draft.offerSummary}
            onChange={(event) => update("offerSummary", event.target.value)}
            placeholder="e.g. Zenekar + Sax"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vendor-link" className={labelClass}>
            Link
          </label>
          <input
            id="vendor-link"
            type="url"
            value={draft.link}
            onChange={(event) => update("link", event.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vendor-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="vendor-notes"
            value={draft.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Anything to remember"
            className={areaClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-xs text-forest">
          <input
            type="checkbox"
            checked={draft.offerRequested}
            onChange={(event) =>
              update("offerRequested", event.target.checked)
            }
            className="h-4 w-4 rounded border-parchment text-forest accent-forest"
          />
          Offer requested
        </label>
        <label className="flex items-center gap-2 text-xs text-forest">
          <input
            type="checkbox"
            checked={draft.agreed}
            onChange={(event) => update("agreed", event.target.checked)}
            className="h-4 w-4 rounded border-parchment text-forest accent-forest"
          />
          Agreed
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-parchment/70 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-wait disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          {busy ? "Saving…" : initial ? "Save changes" : "Add vendor"}
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
