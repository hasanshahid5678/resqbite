import { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface Props {
  allow?: UserRole[];
  children?: ReactNode;
}

export default function RequireAuth({ allow, children }: Props) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children ?? <Outlet />}</>;
}