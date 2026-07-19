import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { Bag, Store, TrendUp, User, Wallet } from "@/components/icons";
import { getAdminStats } from "@/api/admin";
import { adminNav } from "@/lib/nav";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });

  return (
    <DashboardLayout title="Admin" sections={adminNav}>
      <div>
        <span className="chip"><TrendUp size={14} /> Platform overview</span>
        <h1 className="mt-2 heading-display text-2xl md:text-3xl">Admin dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">Monitor the marketplace and approve new partners.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Restaurants" value={stats?.total_restaurants ?? 0} hint={`${stats?.approved_restaurants ?? 0} approved · ${stats?.pending_restaurants ?? 0} pending`} icon={<Store size={20} />} accent="brand" />
        <StatCard label="Customers" value={stats?.total_customers ?? 0} icon={<User size={20} />} accent="sky" />
        <StatCard label="Reservations" value={stats?.total_reservations ?? 0} hint={`${stats?.picked_up_reservations ?? 0} picked up`} icon={<Bag size={20} />} accent="amber" />
        <StatCard label="Active listings" value={stats?.active_listings ?? 0} icon={<Wallet size={20} />} accent="brand" />
      </div>
      {isLoading && <p className="mt-4 text-sm text-ink-muted">Loading stats…</p>}
    </DashboardLayout>
  );
}