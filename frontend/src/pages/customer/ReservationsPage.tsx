import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, Button, EmptyState, Select, Modal, ConfirmDialog } from "@/components/ui";
import QRDisplay from "@/components/QRDisplay";
import { ArrowRight, Bag, Calendar, Clock, MapPin, QrCode, Store } from "@/components/icons";
import { cancelReservation, myReservations } from "@/api/reservations";
import { useToast } from "@/context/ToastContext";
import { customerNav } from "@/lib/nav";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Reservation } from "@/types";

type StatusFilter = "all" | "reserved" | "picked_up" | "cancelled";

export default function ReservationsPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [params] = useSearchParams();
  const focusId = params.get("focus");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [qrFor, setQrFor] = useState<Reservation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", "me", status],
    queryFn: () => myReservations(status === "all" ? undefined : status),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => {
      toast("Reservation cancelled", "info");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      setCancelTarget(null);
    },
    onError: () => toast("Could not cancel", "error"),
  });

  const list = useMemo(() => data ?? [], [data]);
  const active = list.filter((r) => r.reservation_status === "reserved");
  const past = list.filter((r) => r.reservation_status !== "reserved");
  const visible = status === "all" ? active.concat(past) : list.filter((r) => r.reservation_status === status);

  return (
    <DashboardLayout title="Customer" sections={customerNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Bag size={14} /> Your reservations</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">Pickups & history</h1>
        </div>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="md:max-w-[200px]">
          <option value="all">All states</option>
          <option value="reserved">Reserved</option>
          <option value="picked_up">Picked up</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3"><div className="skeleton h-32 w-full" /><div className="skeleton h-32 w-full" /></div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Bag size={36} />}
            title="No reservations yet"
            message="Browse surplus listings and reserve your first meal — it only takes a click."
            action={<Link to="/customer/browse"><Button variant="primary">Browse listings <ArrowRight size={16} /></Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((r) => (
              <Card key={r.id} padded={false} className={`overflow-hidden ${r.id === focusId ? "ring-2 ring-brand-300" : ""}`}>
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100">
                      {r.listing_image_data ? (
                        <img src={r.listing_image_data} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Bag size={22} className="text-brand-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{r.listing_title}</h3>
                        <Badge status={r.reservation_status} />
                        {r.id === focusId && <span className="badge-brand">New</span>}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                        <Store size={14} /> {r.restaurant_name} · {r.restaurant_address}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><Bag size={12} /> Qty {r.quantity}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> Reserved {formatDateTime(r.reserved_at)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> Pickup ends {formatDateTime(r.listing_pickup_end)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{formatPrice(r.quantity * 10)}</span>
                    {r.reservation_status === "reserved" && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => setQrFor(r)}><QrCode size={14} /> View QR</Button>
                        <Button variant="danger" size="sm" onClick={() => setCancelTarget(r)}>Cancel</Button>
                      </>
                    )}
                    {r.reservation_status === "picked_up" && (
                      <span className="badge-brand">Picked up {formatDateTime(r.picked_up_at).split(",")[0]}</span>
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
            <QRDisplay dataUrl={qrFor.qr_code} caption="Show this at pickup" />
            <div className="mt-2 rounded-2xl bg-gray-50 p-4 text-sm ring-1 ring-gray-100 w-full">
              <p className="font-semibold">{qrFor.listing_title}</p>
              <p className="text-ink-muted">Qty {qrFor.quantity} · {qrFor.restaurant_name}</p>
              <p className="mt-1 font-mono text-xs text-ink-muted">ID: {qrFor.id}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel reservation"
        message="Cancelling restores inventory. Are you sure?"
        confirmLabel="Yes, cancel"
        danger
        loading={cancel.isPending}
        onConfirm={() => cancelTarget && cancel.mutate(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />
    </DashboardLayout>
  );
}