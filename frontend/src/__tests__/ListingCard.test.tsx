import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ListingCard from "@/components/ListingCard";
import type { ListingWithRestaurant } from "@/types";

const base: ListingWithRestaurant = {
  id: 1,
  restaurant_id: 1,
  title: "Margherita Pizza",
  description: "Two slices left",
  category: "Pizza",
  original_price: "100",
  discounted_price: "40",
  quantity: 2,
  available_quantity: 2,
  pickup_start: new Date(Date.now() + 3600_000).toISOString(),
  pickup_end: new Date(Date.now() + 5 * 3600_000).toISOString(),
  expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
  image_data: null,
  status: "available",
  created_at: new Date().toISOString(),
  restaurant_name: "Green Bistro",
  restaurant_address: "Moda Cad. No 12",
  restaurant_cuisine: "Mediterranean",
  restaurant_latitude: "40.962",
  restaurant_longitude: "29.06",
};

function renderCard(overrides: Partial<ListingWithRestaurant> = {}) {
  const listing = { ...base, ...overrides };
  return render(
    <MemoryRouter>
      <ListingCard listing={listing} />
    </MemoryRouter>,
  );
}

describe("ListingCard", () => {
  it("renders title and restaurant name", () => {
    renderCard();
    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText(/Green Bistro/)).toBeInTheDocument();
  });

  it("shows discount percentage badge when discounted", () => {
    renderCard();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it("shows low stock warning when ≤3 left", () => {
    renderCard({ available_quantity: 2 });
    expect(screen.getByText(/Only 2 left/)).toBeInTheDocument();
  });

  it("does not show low stock when >3 left", () => {
    renderCard({ available_quantity: 5, quantity: 5 });
    expect(screen.queryByText(/Only \d+ left/)).not.toBeInTheDocument();
  });

  it("link points to /customer/listings/:id", () => {
    const { container } = renderCard();
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/customer/listings/1");
  });

  it("shows distance when provided", () => {
    renderCard({ distance_km: 1.5 });
    expect(screen.getByText(/1.5 km/)).toBeInTheDocument();
  });

  it("shows sold_out badge when sold out", () => {
    renderCard({ status: "sold_out", available_quantity: 0, quantity: 5 });
    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });
});