import { Link } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import { Clock, MapPin, Store } from "@/components/icons";
import { discountPct, formatPrice } from "@/lib/format";
import type { ListingWithRestaurant } from "@/types";

export default function ListingCard({ listing }: { listing: ListingWithRestaurant }) {
  const discount = discountPct(listing.original_price, listing.discounted_price);
  const lowStock = listing.available_quantity <= 3 && listing.status === "available";
  const hasDistance = typeof listing.distance_km === "number" && listing.distance_km != null;
  return (
    <Link to={`/customer/listings/${listing.id}`} className="card card-hover block overflow-hidden">
      <div className="relative aspect-[16/10] bg-gray-100">
        {listing.image_data ? (
          <img src={listing.image_data} alt={listing.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-50 via-brand-100 to-gray-100">
            <Store size={48} className="text-brand-300" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-soft">
            −{discount}%
          </span>
        )}
        <div className="absolute right-3 top-3"><Badge status={listing.status} /></div>
        {lowStock && (
          <div className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            Only {listing.available_quantity} left
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-ink">{listing.title}</h3>
          {hasDistance && (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-medium text-brand-700">
              <MapPin size={11} /> {listing.distance_km} km
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
          <Store size={14} />
          <span className="truncate">{listing.restaurant_name}</span>
          <span className="text-gray-300">·</span>
          <span className="truncate">{listing.restaurant_cuisine}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            Pickup until {new Date(listing.pickup_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {listing.restaurant_address && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin size={11} />
              {listing.restaurant_address.split(",")[0]}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-brand-700">{formatPrice(listing.discounted_price)}</span>
            <span className="text-sm text-gray-400 line-through">{formatPrice(listing.original_price)}</span>
          </div>
          <span className="text-xs font-semibold text-brand-700">Reserve →</span>
        </div>
      </div>
    </Link>
  );
}