import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth, homeForRole } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AppLogo, ArrowRight } from "@/components/icons";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast(`Welcome back, ${user.name.split(" ")[0]}!`, "success");
      navigate(homeForRole(user.role));
    } catch {
      toast("Invalid email or password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <AppLogo size={36} />
          <span className="text-xl font-bold tracking-tight">ResQBite</span>
        </Link>
        <div className="relative">
          <h2 className="heading-display text-4xl leading-tight">Rescue good food.<br />Save money.</h2>
          <p className="mt-4 max-w-md text-white/70">Join 12,000+ customers fighting food waste one meal at a time — and save up to 70% on great local food.</p>
        </div>
        <div className="relative space-y-3">
          {[["55%", "average discount"], ["12M+", "meals rescued"], ["180K+", "partner stores"]].map(([v, l]) => (
            <div key={l} className="flex items-baseline gap-3">
              <span className="text-2xl font-bold">{v}</span>
              <span className="text-sm text-white/60">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Link to="/" className="inline-flex items-center gap-2"><AppLogo size={32} /><span className="text-lg font-bold text-ink">ResQBite</span></Link></div>
          <h1 className="heading-display text-3xl">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Sign in to your ResQBite account.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <Button type="submit" className="btn-block btn-lg" loading={loading}>
              Continue <ArrowRight size={18} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            New to ResQBite?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link>
          </p>

          <div className="mt-8 rounded-2xl bg-gray-50 p-4 text-xs text-ink-muted ring-1 ring-gray-100">
            <p className="font-semibold text-ink">Demo logins (password <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-gray-200">password123</code>)</p>
            <ul className="mt-2 space-y-1">
              <li><span className="font-medium text-brand-700">admin@example.com</span> — admin</li>
              <li><span className="font-medium text-brand-700">green@example.com</span> — approved restaurant</li>
              <li><span className="font-medium text-brand-700">alice@example.com</span> — customer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}