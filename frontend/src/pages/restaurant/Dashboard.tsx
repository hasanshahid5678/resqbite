import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, EmptyState } from "@/components/ui";
import StatCard from "@/components/ui/StatCard";
import { Bag, Calendar, Clock, Edit, Store, TrendUp, Wallet } from "@/components/icons";
import { myListings } from "@/api/listings";
import { restaurantReservations } from "@/api/reservations";
import { myRestaurant } from "@/api/restaurants";
import { restaurantNav } from "@/lib/nav";
import { formatDateTime, formatPrice } from "@/lib/format";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui";

export default function RestaurantDashboard() {
  const { data: restaurant } = useQuery({ queryKey: ["restaurant", "me"], queryFn: myRestaurant });
  const { data: listings } = useQuery({ queryKey: ["listings", "me"], queryFn: myListings });
  const { data: reservations } = useQuery({ queryKey: ["reservations", "restaurant"], queryFn: () => restaurantReservations() });

  const activeCount = listings?.filter((l) => l.status === "available").length || 0;
  const todayReservations = reservations?.filter((r) => new Date(r.reserved_at).toDateString() === new Date().toDateString()).length || 0;
  const rescued = reservations?.filter((r) => r.reservation_status === "picked_up").reduce<number>((s, r) => s + r.quantity, 0) || 0;
  const recovered = reservations?.filter((r) => r.reservation_status === "picked_up").reduce<number>((s, r) => s + r.quantity * 10, 0) || 0;

  const isPending = restaurant?.approval_status === "pending";

  return (
    <DashboardLayout title="Restaurant" sections={restaurantNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Store size={14} /> Restaurant dashboard</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">{restaurant?.name ?? "Your restaurant"}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
            Status: <Badge status={restaurant?.approval_status ?? "pending"} />
          </p>
        </div>
        <Link to="/restaurant/listings/new"><Button variant="primary"><Edit size={16} /> New listing</Button></Link>
      </div>

      {isPending && (
        <Card className="mt-6 bg-amber-50 ring-amber-100">
          <p className="text-sm text-amber-800">
            Your restaurant is awaiting admin approval. You can prepare listings, but they won't be visible to customers until approved.
          </p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={activeCount} icon={<Store size={20} />} accent="brand" />
        <StatCard label="Reservations today" value={todayReservations} icon={<Calendar size={20} />} accent="sky" />
        <StatCard label="Meals rescued" value={rescued} icon={<Bag size={20} />} accent="brand" />
        <StatCard label="Revenue recovered" value={`$${recovered}`} hint="Estimated" icon={<Wallet size={20} />} accent="amber" />
      </div>

      <Card title="Latest reservations" className="mt-8" actions={<Link to="/restaurant/reservations" className="text-sm font-semibold text-brand-700 hover:text-brand-800">View all</Link>}>
        {!reservations || reservations.length === 0 ? (
          <EmptyState icon={<Bag size={32} />} title="No reservations yet" message="Once customers reserve your listings they'll appear here." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {reservations.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{r.listing_title}</p>
                  <p className="text-xs text-ink-muted">Reserved {formatDateTime(r.reserved_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">Qty {r.quantity}</span>
                  <Badge status={r.reservation_status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Quick listing overview" className="mt-8">
        {!listings || listings.length === 0 ? (
          <EmptyState icon={<Store size={32} />} title="No listings yet" message="Create your first surplus listing to start selling." action={<Link to="/restaurant/listings/new" className="btn-primary">New listing</Link>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {listings.slice(0, 6).map((l) => (
              <div key={l.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-ink">{l.title}</p>
                  <Badge status={l.status} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-ink-muted">
                  <span>{l.available_quantity}/{l.quantity} left</span>
                  <span className="font-semibold text-brand-700">{formatPrice(l.discounted_price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}