import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, Button, EmptyState, Select, Modal, ConfirmDialog } from "@/components/ui";
import QRDisplay from "@/components/QRDisplay";
import { Bag, Check, Clock, QrCode, Store } from "@/components/icons";
import { pickupReservation, restaurantReservations } from "@/api/reservations";
import { useToast } from "@/context/ToastContext";
import { restaurantNav } from "@/lib/nav";
import { formatDateTime } from "@/lib/format";
import type { Reservation } from "@/types";

type StatusFilter = "all" | "reserved" | "picked_up" | "cancelled";

export default function RestaurantReservations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [qrFor, setQrFor] = useState<Reservation | null>(null);
  const [pickupConfirm, setPickupConfirm] = useState<Reservation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", "restaurant", status],
    queryFn: () => restaurantReservations(status === "all" ? undefined : status),
  });

  const pickup = useMutation({
    mutationFn: (r: Reservation) => pickupReservation(r.id, { reservation_id: r.id }),
    onSuccess: () => {
      toast("Reservation marked as picked up", "success");
      qc.invalidateQueries({ queryKey: ["reservations", "restaurant"] });
      setPickupConfirm(null);
    },
    onError: () => toast("Could not mark as picked up", "error"),
  });

  const visible = data ?? [];

  return (
    <DashboardLayout title="Restaurant" sections={restaurantNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Bag size={14} /> Reservations</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">Incoming pickups</h1>
          <p className="mt-1 text-sm text-ink-muted">View customer reservations and verify pickups.</p>
        </div>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="md:max-w-[200px]">
          <option value="all">All states</option>
          <option value="reserved">Awaiting pickup</option>
          <option value="picked_up">Picked up</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3"><div className="skeleton h-28 w-full" /><div className="skeleton h-28 w-full" /></div>
        ) : visible.length === 0 ? (
          <EmptyState icon={<Bag size={36} />} title="No reservations yet" message="When customers reserve your listings they will appear here." />
        ) : (
          <div className="space-y-3">
            {visible.map((r) => (
              <Card key={r.id} padded={false}>
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100">
                      {r.listing_image_data ? (
                        <img src={r.listing_image_data} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Bag size={20} className="text-brand-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{r.listing_title}</h3>
                        <Badge status={r.reservation_status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">Customer #{r.customer_id} · Qty {r.quantity}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><Clock size={12} /> Reserved {formatDateTime(r.reserved_at)}</span>
                        <span className="flex items-center gap-1"><Store size={12} /> Pickup until {formatDateTime(r.listing_pickup_end)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setQrFor(r)}><QrCode size={14} /> View QR</Button>
                    {r.reservation_status === "reserved" && (
                      <Button size="sm" onClick={() => setPickupConfirm(r)}><Check size={14} /> Mark picked up</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!qrFor} title="Reservation QR code" onClose={() => setQrFor(null)}>
        {qrFor && (
          <div className="flex flex-col items-center gap-3">
            <QRDisplay dataUrl={qrFor.qr_code} caption="Scan this at pickup to verify" />
            <div className="mt-2 w-full rounded-2xl bg-gray-50 p-4 text-sm ring-1 ring-gray-100">
              <p className="font-semibold">{qrFor.listing_title}</p>
              <p className="text-ink-muted">Qty {qrFor.quantity}</p>
              <p className="mt-1 font-mono text-xs text-ink-muted">ID: {qrFor.id}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pickupConfirm}
        title="Mark as picked up"
        message="Confirm the customer collected the items?"
        confirmLabel="Confirm pickup"
        loading={pickup.isPending}
        onConfirm={() => pickupConfirm && pickup.mutate(pickupConfirm)}
        onCancel={() => setPickupConfirm(null)}
      />
    </DashboardLayout>
  );
}