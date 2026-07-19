export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export function discountPct(original: number | string, discounted: number | string): number {
  const o = Number(original);
  const d = Number(discounted);
  if (!o || o <= 0) return 0;
  return Math.round(((o - d) / o) * 100);
}

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  // ISO time string like "11:00:00"
  return value.slice(0, 5);
}

export function toLocalInputValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local format yyyy-MM-ddTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function statusColor(status: string): string {
  switch (status) {
    case "available":
      return "badge-brand";
    case "sold_out":
      return "badge-yellow";
    case "expired":
    case "rejected":
    case "cancelled":
      return "badge-red";
    case "pending":
      return "badge-gray";
    case "picked_up":
    case "approved":
      return "badge-brand";
    case "inactive":
      return "badge-gray";
    default:
      return "badge-gray";
  }
}