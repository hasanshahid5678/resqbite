import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth, homeForRole } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { AppLogo, ArrowRight, Bag, Store } from "@/components/icons";

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<"customer" | "restaurant">(
    params.get("role") === "restaurant" ? "restaurant" : "customer",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({ name, email, password, role });
      toast(`Account created — welcome, ${user.name.split(" ")[0]}!`, "success");
      navigate(homeForRole(user.role));
    } catch {
      toast("Could not create account (email may already be in use)", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Link to="/" className="inline-flex items-center gap-2"><AppLogo size={32} /><span className="text-lg font-bold text-ink">ResQBite</span></Link></div>
          <h1 className="heading-display text-3xl">Join ResQBite</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Rescue food as a customer or sell surplus as a restaurant — both free.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${role === "customer" ? "bg-white text-ink shadow-soft" : "text-ink-muted"}`}
            >
              <Bag size={16} /> Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("restaurant")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${role === "restaurant" ? "bg-white text-ink shadow-soft" : "text-ink-muted"}`}
            >
              <Store size={16} /> Restaurant
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Select label="Account type" id="role" value={role} onChange={(e) => setRole(e.target.value as "customer" | "restaurant")}>
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant</option>
            </Select>
            <Input label="Full name" name="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" name="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
            {role === "restaurant" && (
              <p className="rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-amber-100">
                Restaurant accounts require admin approval before publishing listings. You'll be able to prep everything in the meantime.
              </p>
            )}
            <Button type="submit" className="btn-block btn-lg" loading={loading}>
              Create account <ArrowRight size={18} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-ink via-brand-900 to-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 h-72 w-72 rounded-full bg-brand-500/10 blur-2xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <AppLogo size={36} />
          <span className="text-xl font-bold tracking-tight">ResQBite</span>
        </Link>
        <div className="relative">
          <h2 className="heading-display text-4xl leading-tight">
            {role === "restaurant"
              ? "Don't bin it. Sell it."
              : "Start rescuing food today."}
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            {role === "restaurant"
              ? "Convert surplus into revenue, attract new customers, and reduce food waste — all in one place."
              : "Save up to 70% on quality meals from local restaurants and shops, just by acting before closing time."}
          </p>
        </div>
        <div className="relative space-y-3">
          {[["+38%", "revenue from surplus"], ["55%", "average discount"], ["0", "setup cost"]].map(([v, l]) => (
            <div key={l} className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{v}</span>
              <span className="text-sm text-white/60">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}