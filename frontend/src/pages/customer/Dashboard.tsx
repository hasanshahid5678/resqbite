import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowRight, Bag, Clock, Heart, MapPin, QrCode, Wallet } from "@/components/icons";
import { myReservations } from "@/api/reservations";
import { customerNav } from "@/lib/nav";
import { formatDateTime, formatPrice } from "@/lib/format";

export default function CustomerDashboard() {
  const { data: active, isLoading: activeLoading } = useQuery({
    queryKey: ["reservations", "me", "reserved"],
    queryFn: () => myReservations("reserved"),
  });
  const { data: history } = useQuery({
    queryKey: ["reservations", "me", "history"],
    queryFn: () => myReservations(),
  });

  const rescued = history?.filter((r) => r.reservation_status === "picked_up").reduce<number>((sum, r) => sum + r.quantity, 0) || 0;
  const savings = history?.filter((r) => r.reservation_status === "picked_up").reduce<number>((sum, r) => {
    return sum + r.quantity * 10;
  }, 0) || 0;
  const activeCount = active?.length || 0;

  const firstName = "there"; // would be user name; layout already shows it

  return (
    <DashboardLayout title="Customer" sections={customerNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Heart size={14} /> Customer dashboard</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-ink-muted">Track your rescues, savings, and active pickups.</p>
        </div>
        <Link to="/customer/browse" className="hidden md:inline-flex">
          <Button variant="primary"><MapPin size={16} /> Browse listings</Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Meals rescued" value={rescued} icon={<Bag size={20} />} accent="brand" />
        <StatCard label="Money saved" value={`$${savings}`} hint="Estimated based on pickups" icon={<Wallet size={20} />} accent="amber" />
        <StatCard label="Active reservations" value={activeCount} hint="Awaiting pickup" icon={<Clock size={20} />} accent="sky" />
      </div>

      <Card
        title="Active pickups"
        className="mt-8"
        actions={<Link to="/customer/reservations" className="text-sm font-semibold text-brand-700 hover:text-brand-800">View all</Link>}
      >
        {activeLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-20 w-full" /><div className="skeleton h-20 w-full" />
          </div>
        ) : !active || active.length === 0 ? (
          <EmptyState
            icon={<Bag size={32} />}
            title="No active pickups"
            message="Browse restaurants and reserve your first surplus meal."
            action={<Link to="/customer/browse"><Button variant="primary">Browse now <ArrowRight size={16} /></Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {active.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 rounded-3xl bg-gray-50 p-4 ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100">
                    {r.listing_image_data ? (
                      <img src={r.listing_image_data} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Bag size={20} className="text-brand-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{r.listing_title}</p>
                    <p className="text-xs text-ink-muted">{r.restaurant_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                      <Clock size={12} /> Pickup by {formatDateTime(r.listing_pickup_end)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={r.reservation_status} />
                  <Link to={`/customer/reservations?focus=${r.id}`}>
                    <Button variant="secondary" size="sm"><QrCode size={14} /> View QR</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Recent activity" className="mt-8">
        {!history || history.length === 0 ? (
          <EmptyState title="No reservation history yet" message="Your past purchases will appear here." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.slice(0, 5).map((r) => (
              <li key={`h-${r.id}`} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{r.listing_title}</p>
                  <p className="text-xs text-ink-muted">{formatDateTime(r.reserved_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{formatPrice(r.quantity * 10)}</span>
                  <Badge status={r.reservation_status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardLayout>
  );
}