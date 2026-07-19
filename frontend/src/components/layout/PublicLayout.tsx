import { Link, Outlet } from "react-router-dom";

import { useAuth, homeForRole } from "@/context/AuthContext";
import { AppLogo } from "@/components/icons";

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <span className="text-lg font-bold tracking-tight text-ink">
              ResQBite
            </span>
          </Link>
          <nav className="flex items-center gap-1 md:gap-2">
            <Link to="/how-it-works" className="nav-link hidden sm:inline-flex">
              How it works
            </Link>
            {user ? (
              <Link to={homeForRole(user.role)} className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Sign in</Link>
                <Link to="/register" className="btn-primary">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 bg-ink text-white/70">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <AppLogo size={28} />
                <span className="text-base font-bold text-white">ResQBite</span>
              </div>
              <p className="mt-3 max-w-md text-sm text-white/60">
                A marketplace connecting restaurants with surplus food to customers
                who want quality meals at a discount — together we cut waste.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Product</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/how-it-works" className="hover:text-white">How it works</Link></li>
                <li><Link to="/register?role=restaurant" className="hover:text-white">For restaurants</Link></li>
                <li><Link to="/register" className="hover:text-white">For customers</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Resources</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
                <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-white">API docs</a></li>
                <li><span className="text-white/40">MVP demonstration</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} ResQBite. All rights reserved.</span>
            <span>Built as an end-to-end MVP.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}