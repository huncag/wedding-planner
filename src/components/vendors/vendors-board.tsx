"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CheckIcon,
  CloseIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { VendorForm } from "@/components/vendors/vendor-form";
import {
  VENDOR_STATUS_OPTIONS,
  groupVendors,
  isBooked,
  summarizeVendors,
  vendorFromRow,
  vendorToRow,
  type Vendor,
  type VendorDraft,
  type VendorRow,
  type VendorStatus,
} from "@/lib/vendors";
import { createClient } from "@/lib/supabase/client";

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function safeHref(link: string): string {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
}

function vendorPatch(draft: VendorDraft): Partial<Vendor> {
  return {
    category: draft.category.trim(),
    name: draft.name.trim(),
    contactInfo: draft.contactInfo.trim() || null,
    handledBy: draft.handledBy.trim() || null,
    link: draft.link.trim() || null,
    offerRequested: draft.offerRequested,
    offerSummary: draft.offerSummary.trim() || null,
    priceNote: draft.priceNote.trim() || null,
    notes: draft.notes.trim() || null,
    agreed: draft.agreed,
    status: draft.status,
  };
}

function statusClasses(status: VendorStatus): string {
  if (isBooked(status)) {
    return "border-forest/25 bg-forest/10 text-forest";
  }

  if (status === "contacted") {
    return "border-gold/45 bg-gold/10 text-gold-ink";
  }

  return "border-parchment bg-ivory text-muted";
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-parchment/80 bg-white/70 p-4 shadow-sm">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl leading-none text-forest">
        {value}
      </p>
    </div>
  );
}

export function VendorsBoard({
  initialVendors,
  initialError = null,
}: {
  initialVendors: Vendor[];
  initialError?: string | null;
}) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saveError, setSaveError] = useState<string | null>(initialError);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const stats = useMemo(() => summarizeVendors(vendors), [vendors]);
  const groups = useMemo(() => groupVendors(vendors), [vendors]);
  const editing = editingId
    ? (vendors.find((vendor) => vendor.id === editingId) ?? null)
    : null;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = normalizedQuery
    ? groups
        .map((group) => ({
          ...group,
          vendors: group.vendors.filter(
            (vendor) =>
              vendor.name.toLowerCase().includes(normalizedQuery) ||
              (vendor.contactInfo ?? "")
                .toLowerCase()
                .includes(normalizedQuery) ||
              (vendor.handledBy ?? "")
                .toLowerCase()
                .includes(normalizedQuery) ||
              (vendor.priceNote ?? "")
                .toLowerCase()
                .includes(normalizedQuery) ||
              (vendor.notes ?? "").toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.vendors.length > 0)
    : groups;

  const setPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async (draft: VendorDraft) => {
    setSaveError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vendors")
        .insert(vendorToRow(draft))
        .select("*")
        .single();

      if (error || !data) {
        setSaveError(
          `Could not add the vendor: ${error?.message ?? "unknown error"}`,
        );
        return false;
      }

      setVendors((current) => [...current, vendorFromRow(data as VendorRow)]);
      setCreateOpen(false);
      return true;
    } catch (error) {
      setSaveError(
        `Could not reach Supabase. The vendor was not added: ${describeError(
          error,
          "unknown error",
        )}`,
      );
      return false;
    }
  }, []);

  const handleUpdate = useCallback(
    async (id: string, draft: VendorDraft) => {
      const previous = vendors.find((vendor) => vendor.id === id);

      if (!previous) {
        return false;
      }

      setSaveError(null);
      setPending(id, true);
      setVendors((current) =>
        current.map((vendor) =>
          vendor.id === id ? { ...vendor, ...vendorPatch(draft) } : vendor,
        ),
      );

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("vendors")
          .update(vendorToRow(draft))
          .eq("id", id)
          .select("*")
          .single();

        if (error || !data) {
          setVendors((current) =>
            current.map((vendor) => (vendor.id === id ? previous : vendor)),
          );
          setSaveError(
            `Could not save the vendor: ${error?.message ?? "unknown error"}`,
          );
          return false;
        }

        setVendors((current) =>
          current.map((vendor) =>
            vendor.id === id ? vendorFromRow(data as VendorRow) : vendor,
          ),
        );
        setEditingId(null);
        return true;
      } catch (error) {
        setVendors((current) =>
          current.map((vendor) => (vendor.id === id ? previous : vendor)),
        );
        setSaveError(
          `Could not reach Supabase. The vendor was not saved: ${describeError(
            error,
            "unknown error",
          )}`,
        );
        return false;
      } finally {
        setPending(id, false);
      }
    },
    [vendors, setPending],
  );

  const patchVendor = useCallback(
    async (
      id: string,
      optimistic: Partial<Vendor>,
      row: Record<string, unknown>,
    ) => {
      const previous = vendors.find((vendor) => vendor.id === id);

      if (!previous) {
        return;
      }

      setSaveError(null);
      setPending(id, true);
      setVendors((current) =>
        current.map((vendor) =>
          vendor.id === id ? { ...vendor, ...optimistic } : vendor,
        ),
      );

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("vendors")
          .update(row)
          .eq("id", id);

        if (error) {
          setVendors((current) =>
            current.map((vendor) => (vendor.id === id ? previous : vendor)),
          );
          setSaveError(`Could not update the vendor: ${error.message}`);
        }
      } catch (error) {
        setVendors((current) =>
          current.map((vendor) => (vendor.id === id ? previous : vendor)),
        );
        setSaveError(
          `Could not reach Supabase. The change was not saved: ${describeError(
            error,
            "unknown error",
          )}`,
        );
      } finally {
        setPending(id, false);
      }
    },
    [vendors, setPending],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const index = vendors.findIndex((vendor) => vendor.id === id);

      if (index === -1) {
        return;
      }

      const removed = vendors[index];
      setSaveError(null);
      setPending(id, true);
      setVendors((current) => current.filter((vendor) => vendor.id !== id));
      setEditingId((current) => (current === id ? null : current));

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("vendors")
          .delete()
          .eq("id", id);

        if (error) {
          setVendors((current) => {
            const next = [...current];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          });
          setSaveError(`Could not delete the vendor: ${error.message}`);
        }
      } catch (error) {
        setVendors((current) => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        setSaveError(
          `Could not reach Supabase. The vendor was not deleted: ${describeError(
            error,
            "unknown error",
          )}`,
        );
      } finally {
        setPending(id, false);
      }
    },
    [vendors, setPending],
  );

  return (
    <div className="space-y-6">
      {saveError ? (
        <p
          role="alert"
          className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-ink"
        >
          {saveError}
        </p>
      ) : null}

      <section aria-label="Vendor summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Vendors" value={stats.total} />
        <Stat label="Booked" value={`${stats.booked} / ${stats.total}`} />
        <Stat label="Agreed" value={stats.agreed} />
        <Stat label="Offers out" value={stats.offersRequested} />
      </section>

      {stats.cancelled > 0 ? (
        <p className="text-xs text-muted">
          {stats.cancelled} cancelled{" "}
          {stats.cancelled === 1 ? "vendor is" : "vendors are"} shown below but
          left out of these totals.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search vendors</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vendors, contacts, notes"
            className="w-full rounded-xl border border-parchment bg-ivory/80 py-2 pl-9 pr-3 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setCreateOpen((current) => !current);
            setEditingId(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          {createOpen ? (
            <CloseIcon className="h-4 w-4" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          {createOpen ? "Close form" : "Add vendor"}
        </button>
      </div>

      {createOpen ? (
        <section className="rounded-2xl border border-parchment/80 bg-white/70 p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-2xl text-forest">New vendor</h2>
          <p className="mt-1 text-sm text-muted">
            Add a supplier, the status of their offer and the price exactly as
            they quoted it.
          </p>
          <div className="mt-5">
            <VendorForm
              key="new-vendor"
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </section>
      ) : null}

      {editing ? (
        <section className="rounded-2xl border border-gold/40 bg-cream/50 p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-2xl text-forest">
            Edit {editing.name}
          </h2>
          <div className="mt-5">
            <VendorForm
              key={editing.id}
              initial={editing}
              onSubmit={(draft) => handleUpdate(editing.id, draft)}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </section>
      ) : null}

      {visibleGroups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-parchment bg-cream/40 px-6 py-10 text-center text-sm text-muted">
          {vendors.length === 0
            ? "No vendors yet. Add the first supplier above — every change is saved for both of you."
            : `No vendors match “${query.trim()}”.`}
        </p>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <section
              key={group.category}
              className="overflow-hidden rounded-2xl border border-parchment/80 bg-white/70 shadow-sm"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-parchment/70 bg-cream/40 px-5 py-3.5">
                <h2 className="font-display text-xl text-forest">
                  {group.category}
                </h2>
                <p className="text-xs text-muted">
                  {group.vendors.length}{" "}
                  {group.vendors.length === 1 ? "vendor" : "vendors"}
                </p>
              </header>

              <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.vendors.map((vendor) => {
                  const pending = pendingIds.has(vendor.id);

                  return (
                    <li
                      key={vendor.id}
                      className="flex flex-col rounded-xl border border-parchment/80 bg-ivory/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-forest">
                            {vendor.name}
                          </p>
                          {vendor.handledBy ? (
                            <p className="mt-0.5 text-[0.65rem] text-muted">
                              Handled by {vendor.handledBy}
                            </p>
                          ) : null}
                        </div>
                        <select
                          value={vendor.status}
                          disabled={pending}
                          aria-label={`Status for ${vendor.name}`}
                          onChange={(event) => {
                            const status = event.target.value as VendorStatus;
                            void patchVendor(
                              vendor.id,
                              { status },
                              { status },
                            );
                          }}
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-50 ${statusClasses(
                            vendor.status,
                          )}`}
                        >
                          {VENDOR_STATUS_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <dl className="mt-3 space-y-1.5 text-xs">
                        {vendor.priceNote ? (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-muted">Price</dt>
                            <dd className="font-medium text-forest">
                              {vendor.priceNote}
                            </dd>
                          </div>
                        ) : null}
                        {vendor.offerSummary ? (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-muted">Offer</dt>
                            <dd className="text-forest/80">
                              {vendor.offerSummary}
                            </dd>
                          </div>
                        ) : null}
                        {vendor.contactInfo ? (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-muted">Contact</dt>
                            <dd className="text-forest/80">
                              {vendor.contactInfo}
                            </dd>
                          </div>
                        ) : null}
                        {vendor.notes ? (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-muted">Notes</dt>
                            <dd className="text-forest/80">{vendor.notes}</dd>
                          </div>
                        ) : null}
                      </dl>

                      {vendor.link ? (
                        <a
                          href={safeHref(vendor.link)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-3 inline-flex w-fit items-center gap-1 text-[0.65rem] font-medium text-gold-ink underline-offset-2 hover:underline"
                        >
                          Open link ↗
                        </a>
                      ) : null}

                      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            void patchVendor(
                              vendor.id,
                              { offerRequested: !vendor.offerRequested },
                              { offer_requested: !vendor.offerRequested },
                            )
                          }
                          disabled={pending}
                          aria-pressed={vendor.offerRequested}
                          className={`rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
                            vendor.offerRequested
                              ? "border-gold/50 bg-gold/10 text-gold-ink"
                              : "border-parchment bg-white text-muted hover:border-gold/40 hover:text-forest"
                          }`}
                        >
                          Offer requested
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void patchVendor(
                              vendor.id,
                              { agreed: !vendor.agreed },
                              { agreed: !vendor.agreed },
                            )
                          }
                          disabled={pending}
                          aria-pressed={vendor.agreed}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
                            vendor.agreed
                              ? "border-forest/25 bg-forest/10 text-forest"
                              : "border-parchment bg-white text-muted hover:border-forest/30 hover:text-forest"
                          }`}
                        >
                          {vendor.agreed ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : null}
                          Agreed
                        </button>

                        <span className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(vendor.id);
                              setCreateOpen(false);
                            }}
                            className="rounded-full border border-parchment bg-white px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-forest/80 transition-colors hover:border-gold/50 hover:text-forest"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(vendor.id)}
                            disabled={pending}
                            aria-label={`Delete ${vendor.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted transition-colors hover:border-parchment hover:bg-white hover:text-forest disabled:opacity-40"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
