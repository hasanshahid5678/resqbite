import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Card, EmptyState, Badge } from "@/components/ui";
import { ArrowLeft, ArrowRight, Bag, Check, Clock, MapPin, QrCode, Store } from "@/components/icons";
import QuantityStepper from "@/components/QuantityStepper";
import { useToast } from "@/context/ToastContext";
import { getListing } from "@/api/listings";
import { createReservation } from "@/api/reservations";
import { customerNav } from "@/lib/nav";
import { discountPct, formatDateTime, formatPrice } from "@/lib/format";
import QRDisplay from "@/components/QRDisplay";
import type { Reservation } from "@/types";

export default function ListingDetail() {
  const { id } = useParams();
  const listingId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => getListing(listingId),
    enabled: !Number.isNaN(listingId),
  });

  const [quantity, setQuantity] = useState(1);
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  const reserve = useMutation({
    mutationFn: () => createReservation({ listing_id: listingId, quantity }),
    onSuccess: (r) => {
      setConfirmed(r);
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["listing", listingId] });
      toast("Reservation created", "success");
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || "Could not reserve";
      toast(typeof msg === "string" ? msg : "Validation error", "error");
    },
  });

  const available = !!listing && listing.available_quantity > 0 && listing.status === "available";

  return (
    <DashboardLayout title="Customer" sections={customerNav}>
      <Link to="/customer/browse" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
        <ArrowLeft size={16} /> Back to browse
      </Link>

      {isLoading || !listing ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="skeleton h-80 w-full lg:col-span-2" />
          <div className="skeleton h-80 w-full" />
        </div>
      ) : confirmed ? (
        <div className="mx-auto mt-6 max-w-lg">
          <Card>
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <Check size={28} />
              </div>
              <h2 className="mt-4 heading-display text-2xl">Reservation confirmed</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Show this QR code at the restaurant during the pickup window.
              </p>
            </div>
            <div className="mt-6"><QRDisplay dataUrl={confirmed.qr_code} /></div>
            <div className="mt-5 space-y-1.5 rounded-2xl bg-gray-50 p-4 text-sm ring-1 ring-gray-100">
              <p className="font-semibold text-ink">{confirmed.listing_title}</p>
              <p className="text-ink-muted">{confirmed.restaurant_name}</p>
              <div className="mt-2 flex justify-between">
                <span className="text-ink-muted">Quantity</span>
                <span className="font-semibold">{confirmed.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Pickup by</span>
                <span className="font-semibold">{formatDateTime(confirmed.listing_pickup_end)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Reservation ID</span>
                <span className="font-mono text-xs text-ink-soft">{confirmed.id.slice(0, 13)}…</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => navigate("/customer/reservations")}>View reservations</Button>
              <Button onClick={() => setConfirmed(null)}>Reserve another</Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200">
                {listing.image_data ? (
                  <img src={listing.image_data} alt={listing.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-gray-300">
                    <Store size={72} />
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-sm font-bold text-white shadow-soft">
                  −{discountPct(listing.original_price, listing.discounted_price)}%
                </span>
                <div className="absolute right-4 top-4"><Badge status={listing.status} /></div>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Store size={16} />
                  <span>{listing.restaurant_name}</span>
                  <span className="text-gray-300">·</span>
                  <span>{listing.restaurant_cuisine}</span>
                </div>
                <h1 className="mt-2 heading-display text-2xl md:text-3xl">{listing.title}</h1>
                {listing.description && (
                  <p className="mt-3 text-base text-ink-soft">{listing.description}</p>
                )}

                <div className="mt-6 flex items-end gap-4 border-t border-gray-100 pt-6">
                  <span className="text-3xl font-bold text-brand-700">
                    {formatPrice(listing.discounted_price)}
                  </span>
                  <span className="pb-1 text-lg text-gray-400 line-through">
                    {formatPrice(listing.original_price)}
                  </span>
                  <span className="ml-auto badge-yellow">Save {discountPct(listing.original_price, listing.discounted_price)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-20">
              <h2 className="text-lg font-semibold text-ink">Reserve this listing</h2>
              {!available ? (
                <EmptyState
                  icon={<Bag size={32} />}
                  title="Not available"
                  message={listing.status === "sold_out" ? "All gone — try another listing." : "This listing cannot be reserved."}
                />
              ) : (
                <>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    <li className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-ink-muted"><Bag size={14} /> Available</span>
                      <span className="font-semibold">{listing.available_quantity} left</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-ink-muted"><Clock size={14} /> Pickup window</span>
                      <span className="text-right font-medium">{formatDateTime(listing.pickup_start).split(",")[1]?.trim() ?? ""}<br />to {formatDateTime(listing.pickup_end)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-ink-muted"><MapPin size={14} /> Address</span>
                      <span className="max-w-[60%] text-right text-xs font-medium">{listing.restaurant_address}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-ink-muted"><QrCode size={14} /> Verification</span>
                      <span className="text-xs font-medium text-brand-700">QR code on reservation</span>
                    </li>
                  </ul>
                  <div className="mt-5">
                    <p className="label">Quantity</p>
                    <div className="flex items-center gap-3">
                      <QuantityStepper
                        value={quantity}
                        onChange={setQuantity}
                        min={1}
                        max={listing.available_quantity}
                      />
                      <span className="text-sm text-ink-muted">
                        Total{" "}
                        <span className="font-semibold text-ink">
                          {formatPrice(Number(listing.discounted_price) * quantity)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <Button
                    className="mt-6 btn-block"
                    size="lg"
                    loading={reserve.isPending}
                    onClick={() => reserve.mutate()}
                  >
                    Reserve {quantity} × {formatPrice(listing.discounted_price).replace(/\.\d+$/, "")} <ArrowRight size={18} />
                  </Button>
                  <p className="mt-3 text-center text-xs text-ink-muted">
                    Cancel anytime before pickup. No payment required in MVP.
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}