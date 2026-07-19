import { type ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "brand" | "amber" | "rose" | "sky";
}

const accents: Record<NonNullable<Props["accent"]>, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
};

export default function StatCard({ label, value, hint, icon, accent = "brand" }: Props) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
        </div>
        {icon && (
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${accents[accent]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}