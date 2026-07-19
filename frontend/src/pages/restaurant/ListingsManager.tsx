import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Button, Badge, EmptyState, ConfirmDialog } from "@/components/ui";
import { Bag, Edit, Store, Trash } from "@/components/icons";
import { deactivateListing, deleteListing, myListings } from "@/api/listings";
import { useToast } from "@/context/ToastContext";
import { restaurantNav } from "@/lib/nav";
import { formatDateTime, formatPrice } from "@/lib/format";

export default function ListingsManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: listings, isLoading } = useQuery({ queryKey: ["listings", "me"], queryFn: myListings });
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<number | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => deleteListing(id),
    onSuccess: () => {
      toast("Listing deleted", "info");
      qc.invalidateQueries({ queryKey: ["listings", "me"] });
      setDeleteTarget(null);
    },
    onError: () => toast("Could not delete listing", "error"),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateListing(id),
    onSuccess: () => {
      toast("Listing deactivated", "info");
      qc.invalidateQueries({ queryKey: ["listings", "me"] });
      setDeactivateTarget(null);
    },
    onError: () => toast("Could not deactivate listing", "error"),
  });

  return (
    <DashboardLayout title="Restaurant" sections={restaurantNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Store size={14} /> Listings</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">Your surplus listings</h1>
          <p className="mt-1 text-sm text-ink-muted">Create, edit, and manage your discounted listings.</p>
        </div>
        <Link to="/restaurant/listings/new"><Button variant="primary">New listing</Button></Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3"><div className="skeleton h-24 w-full" /><div className="skeleton h-24 w-full" /></div>
        ) : !listings || listings.length === 0 ? (
          <EmptyState
            icon={<Store size={36} />}
            title="No listings yet"
            message="Create your first surplus listing to start selling."
            action={<Link to="/restaurant/listings/new" className="btn-primary">New listing</Link>}
          />
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <Card key={l.id} padded={false}>
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100">
                      {l.image_data ? (
                        <img src={l.image_data} alt={l.title} className="h-full w-full object-cover" />
                      ) : (
                        <Bag size={22} className="text-brand-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{l.title}</h3>
                        <Badge status={l.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">{l.category} · Pickup until {formatDateTime(l.pickup_end)}</p>
                      <p className="mt-2 text-sm">
                        <span className="font-bold text-brand-700">{formatPrice(l.discounted_price)}</span>{" "}
                        <span className="text-xs text-gray-400 line-through">{formatPrice(l.original_price)}</span>{" "}
                        <span className="ml-2 text-xs text-ink-muted">{l.available_quantity}/{l.quantity} left</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link to={`/restaurant/listings/${l.id}/edit`}>
                      <Button variant="secondary" size="sm"><Edit size={14} /> Edit</Button>
                    </Link>
                    {l.status !== "inactive" && (
                      <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(l.id)}>Deactivate</Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(l.id)}><Trash size={14} /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete listing"
        message="This action cannot be undone. Existing reservations will be removed."
        confirmLabel="Delete"
        danger
        loading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate listing"
        message="The listing becomes hidden to customers but remains in your dashboard."
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
        onConfirm={() => deactivateTarget && deactivate.mutate(deactivateTarget)}
        onCancel={() => setDeactivateTarget(null)}
      />
    </DashboardLayout>
  );
}