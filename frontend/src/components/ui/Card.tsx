import { type ReactNode } from "react";

interface Props {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  padded?: boolean;
}

export default function Card({ title, children, className, actions, padded = true }: Props) {
  return (
    <div className={`card ${padded ? "p-6" : ""} ${className ?? ""}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-ink">{title}</div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}