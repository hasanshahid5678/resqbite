export type UserRole = "customer" | "restaurant" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ListingStatus = "available" | "sold_out" | "expired" | "inactive";
export type ReservationStatus = "reserved" | "picked_up" | "cancelled";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_suspended: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Restaurant {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number | string;
  longitude: number | string;
  cuisine: string;
  opening_time: string | null;
  closing_time: string | null;
  approval_status: ApprovalStatus;
}

export interface Listing {
  id: number;
  restaurant_id: number;
  title: string;
  description: string | null;
  category: string;
  original_price: string;
  discounted_price: string;
  quantity: number;
  available_quantity: number;
  pickup_start: string;
  pickup_end: string;
  expires_at: string;
  image_data: string | null;
  status: ListingStatus;
  created_at: string;
}

export interface ListingWithRestaurant extends Listing {
  restaurant_name: string;
  restaurant_address: string;
  restaurant_cuisine: string;
  restaurant_latitude: number | string;
  restaurant_longitude: number | string;
  distance_km?: number | null;
}

export interface Reservation {
  id: string;
  customer_id: number;
  listing_id: number;
  quantity: number;
  qr_code: string;
  reservation_status: ReservationStatus;
  reserved_at: string;
  picked_up_at: string | null;
  listing_title: string;
  listing_image_data: string | null;
  restaurant_name: string;
  restaurant_address: string;
  listing_pickup_start: string;
  listing_pickup_end: string;
}

export interface AdminStats {
  total_restaurants: number;
  approved_restaurants: number;
  pending_restaurants: number;
  total_customers: number;
  total_reservations: number;
  active_listings: number;
  picked_up_reservations: number;
}

export interface AdminRestaurant extends Restaurant {
  owner_email: string;
  owner_name: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_suspended: boolean;
}

export interface AdminListing {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  title: string;
  category: string;
  original_price: string;
  discounted_price: string;
  quantity: number;
  available_quantity: number;
  status: ListingStatus;
}