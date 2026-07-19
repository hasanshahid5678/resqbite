import { Bag, Dashboard as DashboardIcon, MapPin, Store, User, Wallet } from "@/components/icons";
import type { NavSection } from "@/components/layout/DashboardLayout";

export const customerNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/customer/dashboard", icon: <DashboardIcon size={18} /> },
      { label: "Browse listings", to: "/customer/browse", icon: <MapPin size={18} /> },
      { label: "Reservations", to: "/customer/reservations", icon: <Bag size={18} /> },
      { label: "Profile", to: "/customer/profile", icon: <User size={18} /> },
    ],
  },
];

export const restaurantNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/restaurant/dashboard", icon: <DashboardIcon size={18} /> },
      { label: "Listings", to: "/restaurant/listings", icon: <Store size={18} /> },
      { label: "Reservations", to: "/restaurant/reservations", icon: <Bag size={18} /> },
    ],
  },
];

export const adminNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardIcon size={18} /> },
      { label: "Restaurants", to: "/admin/restaurants", icon: <Store size={18} /> },
      { label: "Users", to: "/admin/users", icon: <User size={18} /> },
      { label: "Listings", to: "/admin/listings", icon: <Wallet size={18} /> },
    ],
  },
];