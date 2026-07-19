import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Badge, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { customerNav } from "@/lib/nav";

export default function CustomerProfile() {
  const { user, logout } = useAuth();
  return (
    <DashboardLayout title="Customer" sections={customerNav}>
      <div>
        <span className="chip"><span>👤</span> Profile</span>
        <h1 className="mt-2 heading-display text-2xl md:text-3xl">Your account</h1>
      </div>
      <Card className="mt-6 max-w-lg" title="Personal information">
        {user ? (
          <ul className="divide-y divide-gray-100 text-sm">
            <li className="flex justify-between py-3">
              <span className="text-ink-muted">Name</span>
              <span className="font-semibold">{user.name}</span>
            </li>
            <li className="flex justify-between py-3">
              <span className="text-ink-muted">Email</span>
              <span className="font-semibold">{user.email}</span>
            </li>
            <li className="flex justify-between py-3">
              <span className="text-ink-muted">Role</span>
              <Badge status={user.role} />
            </li>
            <li className="flex justify-between py-3">
              <span className="text-ink-muted">Status</span>
              {user.is_suspended ? <Badge status="rejected" label="Suspended" /> : <Badge status="approved" label="Active" />}
            </li>
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Not signed in.</p>
        )}
        <div className="mt-5">
          <Button variant="secondary" onClick={logout}>Sign out</Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}