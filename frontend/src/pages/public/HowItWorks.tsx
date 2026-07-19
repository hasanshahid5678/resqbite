import { Link } from "react-router-dom";

import Button from "@/components/ui/Button";
import { Bag, Check, Leaf, MapPin, Sparkles, Store } from "@/components/icons";

const STEPS = [
  { icon: <MapPin size={24} />, title: "Discover nearby surplus", text: "Browse discounted listings filtered by cuisine, distance, pickup time or discount." },
  { icon: <Bag size={24} />, title: "Reserve instantly with QR", text: "Inventory is reserved in real-time. You receive a QR-coded reservation immediately." },
  { icon: <Check size={24} />, title: "Pick up & enjoy", text: "Restaurant staff verify your QR during the pickup window and mark it complete." },
  { icon: <Leaf size={24} />, title: "Fighting food waste", text: "You've rescued good food from going to waste and done something good for the planet." },
];

export default function HowItWorks() {
  return (
    <div className="bg-white">
      <section className="bg-brand-radial">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip mx-auto"><Sparkles size={14} /> How to use ResQBite</span>
            <h1 className="mt-3 heading-display text-3xl md:text-5xl">Rescue food in <span className="text-brand-700">four</span> simple steps</h1>
            <p className="mt-3 text-base text-ink-muted md:text-lg">From discovery to a finished meal — speed meets sustainability.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card p-8">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-brand">{s.icon}</div>
                <div className="mt-5 text-xs font-bold uppercase tracking-wider text-brand-700">Step {i + 1}</div>
                <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip mx-auto"><Store size={14} /> Two ways to use ResQBite</span>
            <h2 className="mt-3 heading-display text-3xl md:text-4xl">Pick your role</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="card p-8">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><Bag size={26} /></div>
              <h3 className="mt-5 text-xl font-semibold">For customers</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> Discover surplus meals nearby at deep discounts.</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> Reserve instantly and get a QR reservation.</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> Show your QR at pickup — that's it.</li>
              </ul>
              <Link to="/register"><div className="mt-6"><Button variant="primary">I'm a customer</Button></div></Link>
            </div>
            <div className="card p-8">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><Store size={26} /></div>
              <h3 className="mt-5 text-xl font-semibold">For restaurants</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> Create discounted listings of surplus items.</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> Receive reservations from customers instantly.</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> Verify QR codes at pickup and reduce food waste.</li>
              </ul>
              <Link to="/register?role=restaurant"><div className="mt-6"><Button variant="dark">I'm a restaurant</Button></div></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 to-brand-900 p-10 text-center text-white md:p-16">
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <h2 className="relative heading-display text-3xl md:text-4xl">Reduce food waste today</h2>
            <p className="relative mt-3 text-white/70">Join the movement. Every rescue counts.</p>
            <div className="relative mt-6 flex justify-center gap-3">
              <Link to="/register"><Button variant="dark" size="lg">Get started</Button></Link>
              <Link to="/login"><Button variant="secondary" size="lg">Sign in</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}