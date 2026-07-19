import client from "./client";
import type { Reservation, ReservationStatus } from "@/types";

export interface ReservationCreate {
  listing_id: number;
  quantity: number;
}

export async function createReservation(payload: ReservationCreate): Promise<Reservation> {
  const res = await client.post<Reservation>("/reservations", payload);
  return res.data;
}

export async function myReservations(status?: ReservationStatus): Promise<Reservation[]> {
  const res = await client.get<Reservation[]>("/reservations/me", { params: { status } });
  return res.data;
}

export async function restaurantReservations(status?: ReservationStatus): Promise<Reservation[]> {
  const res = await client.get<Reservation[]>("/reservations/restaurant", { params: { status } });
  return res.data;
}

export async function getReservation(id: string): Promise<Reservation> {
  const res = await client.get<Reservation>(`/reservations/${id}`);
  return res.data;
}

export async function pickupReservation(id: string, payload?: { qr_token?: string; reservation_id?: string }): Promise<Reservation> {
  const res = await client.patch<Reservation>(`/reservations/${id}/pickup`, payload ?? {});
  return res.data;
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const res = await client.post<Reservation>(`/reservations/${id}/cancel`);
  return res.data;
}