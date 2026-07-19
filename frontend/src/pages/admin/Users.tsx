import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, Button, EmptyState, Modal } from "@/components/ui";
import { User } from "@/components/icons";
import { listAdminUsers, suspendUser } from "@/api/admin";
import { useToast } from "@/context/ToastContext";
import { adminNav } from "@/lib/nav";
import type { AdminUser } from "@/types";

export default function AdminUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: listAdminUsers });
  const suspend = useMutation({
    mutationFn: ({ id, is_suspended }: { id: number; is_suspended: boolean }) => suspendUser(id, is_suspended),
    onSuccess: () => {
      toast("User updated", "success");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setPendingUser(null);
    },
    onError: () => toast("Failed", "error"),
  });

  const confirmToggle = () => {
    if (!pendingUser) return;
    suspend.mutate({ id: pendingUser.id, is_suspended: !pendingUser.is_suspended });
  };

  return (
    <DashboardLayout title="Admin" sections={adminNav}>
      <div>
        <span className="chip"><User size={14} /> User management</span>
        <h1 className="mt-2 heading-display text-2xl md:text-3xl">All users</h1>
        <p className="mt-1 text-sm text-ink-muted">Suspend abusive accounts or restore access.</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3"><div className="skeleton h-64 w-full" /></div>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<User size={36} />} title="No users" />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60 text-left text-xs uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((u) => (
                    <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                      <td className="px-5 py-3 font-medium text-ink">{u.name}</td>
                      <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                      <td className="px-5 py-3"><Badge status={u.role} /></td>
                      <td className="px-5 py-3">
                        {u.is_suspended ? <Badge status="rejected" label="Suspended" /> : <Badge status="approved" label="Active" />}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.role !== "admin" && (
                          <Button variant={u.is_suspended ? "primary" : "danger"} size="sm" onClick={() => setPendingUser(u)}>
                            {u.is_suspended ? "Unsuspend" : "Suspend"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={!!pendingUser} title={pendingUser?.is_suspended ? "Unsuspend user" : "Suspend user"} onClose={() => setPendingUser(null)} footer={
        <>
          <Button variant="secondary" onClick={() => setPendingUser(null)}>Cancel</Button>
          <Button variant={pendingUser?.is_suspended ? "primary" : "danger"} loading={suspend.isPending} onClick={confirmToggle}>
            {pendingUser?.is_suspended ? "Unsuspend" : "Suspend"}
          </Button>
        </>
      }>
        {pendingUser?.is_suspended
          ? `Restore ${pendingUser.name}'s access?`
          : `Suspend ${pendingUser?.name}? They will no longer be able to sign in.`}
      </Modal>
    </DashboardLayout>
  );
}