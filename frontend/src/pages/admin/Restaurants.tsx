import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, Button, EmptyState, Select, ConfirmDialog } from "@/components/ui";
import { Check, MapPin, Store, User } from "@/components/icons";
import { approveRestaurant, listAdminRestaurants, rejectRestaurant } from "@/api/admin";
import { useToast } from "@/context/ToastContext";
import { adminNav } from "@/lib/nav";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminRestaurants() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [target, setTarget] = useState<{ id: number; action: "approve" | "reject" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "restaurants", status],
    queryFn: () => listAdminRestaurants(status === "all" ? undefined : status),
  });

  const approve = useMutation({
    mutationFn: (id: number) => approveRestaurant(id),
    onSuccess: () => {
      toast("Restaurant approved", "success");
      qc.invalidateQueries({ queryKey: ["admin"] });
      setTarget(null);
    },
    onError: () => toast("Failed", "error"),
  });
  const reject = useMutation({
    mutationFn: (id: number) => rejectRestaurant(id),
    onSuccess: () => {
      toast("Restaurant rejected", "info");
      qc.invalidateQueries({ queryKey: ["admin"] });
      setTarget(null);
    },
    onError: () => toast("Failed", "error"),
  });

  return (
    <DashboardLayout title="Admin" sections={adminNav}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip"><Store size={14} /> Restaurant approval</span>
          <h1 className="mt-2 heading-display text-2xl md:text-3xl">Manage restaurants</h1>
          <p className="mt-1 text-sm text-ink-muted">Approve new partners or reject fraudulent submissions.</p>
        </div>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="md:max-w-[200px]">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3"><div className="skeleton h-28 w-full" /><div className="skeleton h-28 w-full" /></div>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Store size={36} />} title="No restaurants" message="No restaurants match this filter." />
        ) : (
          <div className="space-y-3">
            {data.map((r) => (
              <Card key={r.id} padded={false}>
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink">{r.name}</h3>
                      <Badge status={r.approval_status} />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                      <MapPin size={14} /> {r.cuisine} · {r.address}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                      <User size={12} /> {r.owner_name} · {r.owner_email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {r.approval_status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => setTarget({ id: r.id, action: "approve" })}><Check size={14} /> Approve</Button>
                        <Button variant="secondary" size="sm" onClick={() => setTarget({ id: r.id, action: "reject" })}>Reject</Button>
                      </>
                    )}
                    {r.approval_status === "approved" && (
                      <Button variant="secondary" size="sm" onClick={() => setTarget({ id: r.id, action: "reject" })}>Revoke</Button>
                    )}
                    {r.approval_status === "rejected" && (
                      <Button size="sm" onClick={() => setTarget({ id: r.id, action: "approve" })}>Re-approve</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        title={target?.action === "approve" ? "Approve restaurant" : "Reject restaurant"}
        message={
          target?.action === "approve"
            ? "Approving lets the restaurant publish listings to customers."
            : "Rejecting hides the restaurant from customers."
        }
        confirmLabel={target?.action === "approve" ? "Approve" : "Reject"}
        danger={target?.action === "reject"}
        loading={approve.isPending || reject.isPending}
        onConfirm={() => {
          if (!target) return;
          if (target.action === "approve") approve.mutate(target.id);
          else reject.mutate(target.id);
        }}
        onCancel={() => setTarget(null)}
      />
    </DashboardLayout>
  );
}