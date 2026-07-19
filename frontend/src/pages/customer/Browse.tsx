import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input, Select } from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import ListingCard from "@/components/ListingCard";
import LocationPickerModal from "@/components/LocationPickerModal";
import { listListings, type ListListingsParams } from "@/api/listings";
import { customerNav } from "@/lib/nav";
import { Search, Store, MapPin } from "@/components/icons";
import {
  clearStoredLocation,
  hasAutoOpenedPicker,
  loadStoredLocation,
  markAutoOpenedPicker,
  saveStoredLocation,
  type CustomerLocation,
} from "@/lib/location";

export default function BrowsePage() {
  // Search/filter UI state
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minDiscount, setMinDiscount] = useState(0);

  // Customer location state (persisted to localStorage)
  const [location, setLocation] = useState<CustomerLocation | null>(() => loadStoredLocation());
  const [pickerOpen, setPickerOpen] = useState(false);

  // Auto-open the picker the first time a customer arrives at Browse
  // without any saved location. sessionStorage guard stops re-prompt in
  // the same browser session.
  useEffect(() => {
    if (location || hasAutoOpenedPicker()) return;
    markAutoOpenedPicker();
    setPickerOpen(true);
  }, [location]);

  const onPickLocation = (loc: CustomerLocation) => {
    setLocation(loc);
    saveStoredLocation(loc);
    setPickerOpen(false);
  };

  const onChangeLocation = () => setPickerOpen(true);

  const onClearLocation = () => {
    clearStoredLocation();
    setLocation(null);
    setPickerOpen(true);
  };

  // Build the API params: always filter by city if we have one,
  // also send lat/lng (no radius_km — we want all listings in that city)
  // so the backend can decorate distance_km on each card.
  const params = useMemo<ListListingsParams>(() => {
    const p: ListListingsParams = { page: 1, page_size: 24 };
    if (location) {
      p.city = location.city;
      if (location.coords) {
        p.lat = location.coords.lat;
        p.lng = location.coords.lng;
      }
    }
    return p;
  }, [location]);

  const { data, isLoading } = useQuery({
    queryKey: ["listings", "browse", params, q, category, minDiscount],
    queryFn: () => listListings({
      ...params,
      q: q || undefined,
      category: category || undefined,
      min_discount: minDiscount || undefined,
    }),
  });

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setMinDiscount(0);
  };

  const hasActiveFilters = q !== "" || category !== "" || minDiscount > 0;

  return (
    <DashboardLayout title="Customer" sections={customerNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Store size={14} /> Browse surplus food</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">
            Discover great meals near you
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Filter by cuisine, discount, pickup time — listings from your city.
          </p>
        </div>

        {/* Current location indicator + change/clear */}
        {location ? (
          <div className="flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-sm ring-1 ring-inset ring-brand-100">
            <MapPin size={16} className="text-brand-700" />
            <div className="flex flex-col">
              <span className="text-xs text-ink-muted">Showing listings in</span>
              <span className="font-semibold text-ink">
                {location.city}
                {location.coords && <span className="ml-1 text-xs font-normal text-ink-muted">· GPS</span>}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={onChangeLocation} className="ml-2">
              Change
            </Button>
            <button
              onClick={onClearLocation}
              className="rounded-full px-2 py-1 text-xs text-ink-muted hover:bg-white hover:text-ink"
              title="Clear location"
            >
              Clear
            </button>
          </div>
        ) : (
          <Button variant="primary" onClick={() => setPickerOpen(true)}>
            <MapPin size={16} /> Set location
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 card p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="Search"
            name="q"
            placeholder="Pizza, salad, bakery…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search size={16} />}
          />
          <Input
            label="Cuisine / category"
            name="category"
            placeholder="Mediterranean"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            label="Min discount"
            id="min_discount"
            value={minDiscount}
            onChange={(e) => setMinDiscount(Number(e.target.value))}
          >
            {[0, 10, 25, 50].map((v) => <option key={v} value={v}>{v}%+</option>)}
          </Select>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear filters
            </Button>
          </div>
        </div>
        {!location && (
          <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-ink-muted">
            No location set — showing all listings. Click <span className="font-semibold">Set location</span> above to filter by city.
          </p>
        )}
      </div>

      {/* Results */}
      <div className="mt-8 min-h-[200px]">
        {isLoading ? (
          <SkeletonList count={8} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Store size={36} />}
            title="No listings found"
            message={
              location
                ? "Try clearing filters, change your city, or check back later — new deals appear daily."
                : "Set your location or adjust filters to find surplus listings."
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              {data.length} listing{data.length !== 1 ? "s" : ""} found
              {location && <span> in <strong className="text-ink">{location.city}</strong></span>}
              {location?.coords && <span className="text-ink-muted"> · distances shown from your GPS location</span>}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </>
        )}
      </div>

      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onPickLocation}
        initial={location}
      />
    </DashboardLayout>
  );
}