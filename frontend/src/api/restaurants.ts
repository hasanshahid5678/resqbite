import client from "./client";
import type { Restaurant } from "@/types";

export interface RestaurantCreate {
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  cuisine: string;
  opening_time?: string | null;
  closing_time?: string | null;
}

export async function listRestaurants(params?: {
  cuisine?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}): Promise<Restaurant[]> {
  const res = await client.get<Restaurant[]>("/restaurants", { params });
  return res.data;
}

export async function getRestaurant(id: number): Promise<Restaurant> {
  const res = await client.get<Restaurant>(`/restaurants/${id}`);
  return res.data;
}

export async function myRestaurant(): Promise<Restaurant | null> {
  try {
    const res = await client.get<Restaurant>("/restaurants/me");
    return res.data;
  } catch {
    return null;
  }
}

export async function createRestaurant(payload: RestaurantCreate): Promise<Restaurant> {
  const res = await client.post<Restaurant>("/restaurants", payload);
  return res.data;
}

export async function updateRestaurant(payload: Partial<RestaurantCreate>): Promise<Restaurant> {
  const res = await client.patch<Restaurant>("/restaurants", payload);
  return res.data;
}