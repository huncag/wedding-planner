import type { Currency } from "@/lib/currency";

export const VENDOR_STATUS_OPTIONS = [
  { id: "researching", label: "Researching", tone: "muted" },
  { id: "contacted", label: "Contacted", tone: "accent" },
  { id: "booked", label: "Booked", tone: "success" },
  { id: "completed", label: "Completed", tone: "success" },
  { id: "cancelled", label: "Cancelled", tone: "muted" },
] as const;

export type VendorStatus = (typeof VENDOR_STATUS_OPTIONS)[number]["id"];

/** Categories the couple already uses, offered as quick suggestions. */
export const VENDOR_CATEGORY_SUGGESTIONS = [
  "Helyszín",
  "Zene",
  "Fotó",
  "Videó",
  "Ceremóniamester",
  "Díszlet",
  "Candy bar",
  "Tiramisu",
  "Catering",
  "Egyéb",
] as const;

export type Vendor = {
  id: string;
  category: string;
  name: string;
  contactInfo: string | null;
  handledBy: string | null;
  link: string | null;
  offerRequested: boolean;
  offerSummary: string | null;
  priceNote: string | null;
  notes: string | null;
  agreed: boolean;
  totalCost: number;
  currency: Currency;
  status: VendorStatus;
};

/** Every editable field, shared by the create and edit forms. */
export type VendorDraft = {
  category: string;
  name: string;
  contactInfo: string;
  handledBy: string;
  link: string;
  offerRequested: boolean;
  offerSummary: string;
  priceNote: string;
  notes: string;
  agreed: boolean;
  status: VendorStatus;
};

/** Shape of a `public.vendors` row as returned by PostgREST. */
export type VendorRow = {
  id: string;
  category: string;
  name: string;
  contact_info: string | null;
  handled_by: string | null;
  link: string | null;
  offer_requested: boolean | null;
  offer_summary: string | null;
  price_note: string | null;
  notes: string | null;
  agreed: boolean | null;
  total_cost: number | string | null;
  currency: Currency | null;
  status: string;
};

export function isVendorStatus(value: string): value is VendorStatus {
  return VENDOR_STATUS_OPTIONS.some((option) => option.id === value);
}

export function vendorStatusLabel(status: VendorStatus): string {
  return (
    VENDOR_STATUS_OPTIONS.find((option) => option.id === status)?.label ??
    "Researching"
  );
}

export function vendorFromRow(row: VendorRow): Vendor {
  const cost =
    typeof row.total_cost === "number"
      ? row.total_cost
      : Number(row.total_cost ?? 0);

  return {
    id: row.id,
    category: row.category,
    name: row.name,
    contactInfo: row.contact_info,
    handledBy: row.handled_by,
    link: row.link,
    offerRequested: Boolean(row.offer_requested),
    offerSummary: row.offer_summary,
    priceNote: row.price_note,
    notes: row.notes,
    agreed: Boolean(row.agreed),
    totalCost: Number.isFinite(cost) ? cost : 0,
    currency: row.currency === "EUR" ? "EUR" : "RON",
    status: isVendorStatus(row.status) ? row.status : "researching",
  };
}

export function vendorToRow(draft: VendorDraft) {
  return {
    category: draft.category.trim(),
    name: draft.name.trim(),
    contact_info: draft.contactInfo.trim() || null,
    handled_by: draft.handledBy.trim() || null,
    link: draft.link.trim() || null,
    offer_requested: draft.offerRequested,
    offer_summary: draft.offerSummary.trim() || null,
    price_note: draft.priceNote.trim() || null,
    notes: draft.notes.trim() || null,
    agreed: draft.agreed,
    status: draft.status,
  };
}

export function draftFromVendor(vendor: Vendor): VendorDraft {
  return {
    category: vendor.category,
    name: vendor.name,
    contactInfo: vendor.contactInfo ?? "",
    handledBy: vendor.handledBy ?? "",
    link: vendor.link ?? "",
    offerRequested: vendor.offerRequested,
    offerSummary: vendor.offerSummary ?? "",
    priceNote: vendor.priceNote ?? "",
    notes: vendor.notes ?? "",
    agreed: vendor.agreed,
    status: vendor.status,
  };
}

export const EMPTY_VENDOR_DRAFT: VendorDraft = {
  category: "",
  name: "",
  contactInfo: "",
  handledBy: "",
  link: "",
  offerRequested: false,
  offerSummary: "",
  priceNote: "",
  notes: "",
  agreed: false,
  status: "researching",
};

export type VendorStats = {
  total: number;
  booked: number;
  agreed: number;
  offersRequested: number;
  categories: number;
};

export function summarizeVendors(vendors: readonly Vendor[]): VendorStats {
  return {
    total: vendors.length,
    booked: vendors.filter(
      (vendor) => vendor.status === "booked" || vendor.status === "completed",
    ).length,
    agreed: vendors.filter((vendor) => vendor.agreed).length,
    offersRequested: vendors.filter((vendor) => vendor.offerRequested).length,
    categories: new Set(vendors.map((vendor) => vendor.category)).size,
  };
}

/** Groups by category, keeping the order the categories first appear in. */
export function groupVendors(vendors: readonly Vendor[]) {
  const order: string[] = [];

  for (const vendor of vendors) {
    const category = vendor.category.trim() || "Other";

    if (!order.includes(category)) {
      order.push(category);
    }
  }

  return order.map((category) => ({
    category,
    vendors: vendors.filter(
      (vendor) => (vendor.category.trim() || "Other") === category,
    ),
  }));
}

export function isBooked(status: VendorStatus): boolean {
  return status === "booked" || status === "completed";
}
