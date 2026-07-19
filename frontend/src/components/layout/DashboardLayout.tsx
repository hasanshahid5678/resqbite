import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { AppLogo, Logout } from "@/components/icons";

interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

interface Props {
  title: string;
  sections: NavSection[];
  children: ReactNode;
}

export default function DashboardLayout({ title, sections, children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50/70">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
          <AppLogo size={28} />
          <span className="font-bold tracking-tight text-ink">ResQBite</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {sections.map((section, si) => (
            <div key={si} className="mb-4">
              {section.label && (
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted/70">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.endsWith("/dashboard")}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" : "text-ink-soft hover:bg-gray-100 hover:text-ink"}`
                  }
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <div className="rounded-2xl bg-gray-50 p-3">
            <p className="text-xs text-ink-muted">Signed in as</p>
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <button onClick={onLogout} className="nav-link mt-2 w-full justify-start">
            <Logout size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <AppLogo size={22} />
            <span className="font-semibold text-ink">{title}</span>
          </div>
          <button onClick={onLogout} className="text-sm text-ink-muted">Sign out</button>
        </header>
        <main className="flex-1 p-4 md:p-10">
          <div className="mx-auto max-w-7xl">
            {/* Mobile horizontal nav */}
            <div className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
              {sections.flatMap((s) => s.items).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.endsWith("/dashboard")}
                  className={({ isActive }) =>
                    `flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100" : "bg-white text-ink-soft ring-1 ring-gray-200"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}