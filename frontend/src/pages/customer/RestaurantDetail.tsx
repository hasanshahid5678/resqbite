import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import MapView from "@/components/MapView";
import { Card, Badge, EmptyState, Button, Skeleton } from "@/components/ui";
import { ArrowLeft, Clock, MapPin, Star, Store } from "@/components/icons";
import { getRestaurant } from "@/api/restaurants";
import { listListings } from "@/api/listings";
import { customerNav } from "@/lib/nav";
import { formatTime } from "@/lib/format";
import ListingCard from "@/components/ListingCard";

export default function RestaurantDetail() {
  const { id } = useParams();
  const restaurantId = Number(id);
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => getRestaurant(restaurantId),
    enabled: !Number.isNaN(restaurantId),
  });
  const { data: listings } = useQuery({
    queryKey: ["listings", "restaurant", restaurantId],
    queryFn: () => listListings({ restaurant_id: restaurantId, page_size: 50 }),
    enabled: !Number.isNaN(restaurantId),
  });

  const markers = useMemo(() => {
    if (!restaurant) return [];
    return [{ lat: Number(restaurant.latitude), lng: Number(restaurant.longitude), label: restaurant.name }];
  }, [restaurant]);

  return (
    <DashboardLayout title="Customer" sections={customerNav}>
      <Link to="/customer/browse" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
        <ArrowLeft size={16} /> Back to browse
      </Link>

      {isLoading || !restaurant ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /></div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <Badge status={restaurant.approval_status} />
                    <span>{restaurant.cuisine}</span>
                  </div>
                  <h1 className="mt-2 heading-display text-2xl md:text-3xl">{restaurant.name}</h1>
                  <p className="mt-3 text-ink-soft">{restaurant.description || "A partner restaurant committed to reducing food waste."}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {restaurant.address}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {formatTime(restaurant.opening_time)} – {formatTime(restaurant.closing_time)}</span>
                    <span className="flex items-center gap-1.5"><Star size={14} /> New on ResQBite</span>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <div className="flex items-end justify-between">
                <h2 className="heading-display text-xl">Available surplus items</h2>
                <Link to="/customer/browse" className="text-sm font-semibold text-brand-700">Back to browse →</Link>
              </div>
              <div className="mt-3">
                {!listings || listings.length === 0 ? (
                  <EmptyState icon={<Store size={36} />} title="No active listings" message="This restaurant has no surplus items right now — check back later." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card title="Location">
              <MapView markers={markers} height="280px" />
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <MapPin size={12} /> {restaurant.address}
              </p>
            </Card>
            <Card title="Hours">
              <ul className="space-y-1.5 text-sm">
                <li className="flex justify-between">
                  <span className="text-ink-muted">Opening</span>
                  <span className="font-semibold">{formatTime(restaurant.opening_time)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted">Closing</span>
                  <span className="font-semibold">{formatTime(restaurant.closing_time)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted">Cuisine</span>
                  <span className="font-semibold">{restaurant.cuisine}</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}