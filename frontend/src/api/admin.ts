import client from "./client";
import type { AdminListing, AdminRestaurant, AdminStats, AdminUser } from "@/types";

export async function getAdminStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>("/admin/stats");
  return res.data;
}

export async function listAdminRestaurants(approval_status?: string): Promise<AdminRestaurant[]> {
  const res = await client.get<AdminRestaurant[]>("/admin/restaurants", { params: { approval_status } });
  return res.data;
}

export async function approveRestaurant(id: number): Promise<AdminRestaurant> {
  const res = await client.patch<AdminRestaurant>(`/admin/restaurants/${id}/approve`);
  return res.data;
}

export async function rejectRestaurant(id: number): Promise<AdminRestaurant> {
  const res = await client.patch<AdminRestaurant>(`/admin/restaurants/${id}/reject`);
  return res.data;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const res = await client.get<AdminUser[]>("/admin/users");
  return res.data;
}

export async function suspendUser(id: number, is_suspended: boolean): Promise<AdminUser> {
  const res = await client.patch<AdminUser>(`/admin/users/${id}/suspend`, { is_suspended });
  return res.data;
}

export async function listAdminListings(): Promise<AdminListing[]> {
  const res = await client.get<AdminListing[]>("/admin/listings");
  return res.data;
}