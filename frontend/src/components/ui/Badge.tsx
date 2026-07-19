import { statusColor } from "@/lib/format";

export default function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`${statusColor(status)} capitalize`}>{label ?? status.replace("_", " ")}</span>
  );
}