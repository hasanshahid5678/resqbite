import client from "./client";
import type { Listing, ListingWithRestaurant } from "@/types";

export interface ListingCreate {
  title: string;
  description?: string | null;
  category: string;
  original_price: string;
  discounted_price: string;
  quantity: number;
  pickup_start: string;
  pickup_end: string;
  expires_at: string;
  image_data?: string | null;
}

export interface ListListingsParams {
  page?: number;
  page_size?: number;
  restaurant_id?: number;
  category?: string;
  city?: string;
  min_discount?: number;
  pickup_after?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

export async function listListings(params?: ListListingsParams): Promise<ListingWithRestaurant[]> {
  const res = await client.get<ListingWithRestaurant[]>("/listings", { params });
  return res.data;
}

export async function getListing(id: number): Promise<ListingWithRestaurant> {
  const res = await client.get<ListingWithRestaurant>(`/listings/${id}`);
  return res.data;
}

export async function myListings(): Promise<Listing[]> {
  const res = await client.get<Listing[]>("/listings/me/listings");
  return res.data;
}

export async function createListing(payload: ListingCreate): Promise<Listing> {
  const res = await client.post<Listing>("/listings", payload);
  return res.data;
}

export async function updateListing(id: number, payload: Partial<ListingCreate>): Promise<Listing> {
  const res = await client.put<Listing>(`/listings/${id}`, payload);
  return res.data;
}

export async function deleteListing(id: number): Promise<void> {
  await client.delete(`/listings/${id}`);
}

export async function deactivateListing(id: number): Promise<Listing> {
  const res = await client.patch<Listing>(`/listings/${id}/deactivate`);
  return res.data;
}