import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Store } from "@/components/icons";
import { listAdminListings } from "@/api/admin";
import { adminNav } from "@/lib/nav";
import { formatPrice } from "@/lib/format";

export default function AdminListings() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "listings"], queryFn: listAdminListings });

  return (
    <DashboardLayout title="Admin" sections={adminNav}>
      <div>
        <span className="chip"><Store size={14} /> Marketplace content</span>
        <h1 className="mt-2 heading-display text-2xl md:text-3xl">All listings</h1>
        <p className="mt-1 text-sm text-ink-muted">Browse every listing across all restaurants.</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="skeleton h-64 w-full" />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Store size={36} />} title="No listings" />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Restaurant</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Price</th>
                    <th className="px-5 py-3 font-semibold">Quantity</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((l) => (
                    <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                      <td className="px-5 py-3 font-medium text-ink">{l.title}</td>
                      <td className="px-5 py-3 text-ink-soft">{l.restaurant_name}</td>
                      <td className="px-5 py-3 text-ink-soft">{l.category}</td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-brand-700">{formatPrice(l.discounted_price)}</span>{" "}
                        <span className="text-xs text-gray-400 line-through">{formatPrice(l.original_price)}</span>
                      </td>
                      <td className="px-5 py-3">{l.available_quantity}/{l.quantity}</td>
                      <td className="px-5 py-3"><Badge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}