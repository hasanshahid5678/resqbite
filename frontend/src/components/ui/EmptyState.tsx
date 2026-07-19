import { type ReactNode } from "react";

interface Props {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, message, icon, action }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="text-brand-500">{icon ?? <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h18M5 7l1.5 13h11L19 7M9 4h6v3H9V4Z" strokeLinecap="round" strokeLinejoin="round" /></svg>}</div>
      <p className="text-base font-medium text-gray-800">{title ?? "Nothing here yet"}</p>
      {message && <p className="max-w-md text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}