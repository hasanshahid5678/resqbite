import { Navigate, Route, Routes } from "react-router-dom";

import RequireAuth from "@/components/RequireAuth";
import PublicLayout from "@/components/layout/PublicLayout";
import LandingPage from "@/pages/public/LandingPage";
import HowItWorks from "@/pages/public/HowItWorks";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import CustomerDashboard from "@/pages/customer/Dashboard";
import BrowsePage from "@/pages/customer/Browse";
import RestaurantDetail from "@/pages/customer/RestaurantDetail";
import ListingDetail from "@/pages/customer/ListingDetail";
import ReservationsPage from "@/pages/customer/ReservationsPage";
import CustomerProfile from "@/pages/customer/Profile";
import RestaurantDashboard from "@/pages/restaurant/Dashboard";
import ListingsManager from "@/pages/restaurant/ListingsManager";
import ListingForm from "@/pages/restaurant/ListingForm";
import RestaurantReservations from "@/pages/restaurant/Reservations";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminRestaurants from "@/pages/admin/Restaurants";
import AdminUsers from "@/pages/admin/Users";
import AdminListings from "@/pages/admin/Listings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="how-it-works" element={<HowItWorks />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/customer" element={<RequireAuth allow={["customer"]} />}>
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="restaurants/:id" element={<RestaurantDetail />} />
        <Route path="listings/:id" element={<ListingDetail />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="/restaurant" element={<RequireAuth allow={["restaurant"]} />}>
        <Route index element={<Navigate to="/restaurant/dashboard" replace />} />
        <Route path="dashboard" element={<RestaurantDashboard />} />
        <Route path="listings" element={<ListingsManager />} />
        <Route path="listings/new" element={<ListingForm />} />
        <Route path="listings/:id/edit" element={<ListingForm />} />
        <Route path="reservations" element={<RestaurantReservations />} />
      </Route>

      <Route path="/admin" element={<RequireAuth allow={["admin"]} />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="listings" element={<AdminListings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}