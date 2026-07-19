import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listListings } from "@/api/listings";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui";
import {
  ArrowRight,
  Bag,
  Check,
  Leaf,
  MapPin,
  Sparkles,
  Star,
  Store,
  Wallet,
} from "@/components/icons";

const CUISINES = ["Pizza", "Sushi", "Bakery", "Burgers", "Salads", "Poke", "Coffee", "Desserts", "Groceries", "Mexican", "Indian", "Vegan"];

const STEPS = [
  { n: 1, title: "Discover nearby surplus", text: "Browse discounted listings filtered by cuisine, distance, pickup time or discount.", icon: <MapPin size={22} /> },
  { n: 2, title: "Reserve instantly with QR", text: "Inventory is reserved in real time — you receive a QR-coded reservation immediately.", icon: <Bag size={22} /> },
  { n: 3, title: "Pick up & enjoy", text: "Restaurant staff scan your code during the pickup window and mark it complete.", icon: <Check size={22} /> },
  { n: 4, title: "Fight food waste", text: "You've rescued good food from going to waste and done something good for the planet.", icon: <Leaf size={22} /> },
];

const IMPACT = [
  { label: "Meals rescued", value: "12.4M+" },
  { label: "Tons of CO₂ saved", value: "8.9K" },
  { label: "Partner stores", value: "180K+" },
  { label: "Avg. discount", value: "55%" },
];

export default function LandingPage() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: () => listListings({ page: 1, page_size: 4 }),
  });
  const showFeatured = !isLoading && featured && featured.length > 0;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-radial">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <span className="chip">
                <Sparkles size={14} /> Rescue food · Save money · Cut waste
              </span>
              <h1 className="mt-5 heading-display text-ink text-[clamp(2.5rem,5vw,4rem)] leading-[1.05]">
                Surplus food from local restaurants,{" "}
                <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                  at a fraction of the price.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-muted">
                ResQBite connects you with nearby restaurants selling their unsold
                meals before closing time. Reserve, pick up, and enjoy — no waste,
                no fuss.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="lg">Browse as customer <ArrowRight size={18} /></Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="secondary" size="lg">How it works</Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-ink-muted">
                <div className="flex -space-x-2">
                  {["bg-brand-500", "bg-amber-400", "bg-rose-400", "bg-sky-500"].map((c, i) => (
                    <span key={i} className={`grid h-8 w-8 place-items-center rounded-full ${c} text-xs font-bold text-white ring-2 ring-white`}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                  ))}
                </div>
                <p className="flex items-center gap-2">
                  <span className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className="fill-amber-400" />)}
                  </span>
                  Loved by 12,000+ food rescuers
                </p>
              </div>
            </div>

            {/* Hero visual — center-surprise-bag style cluster */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-square rounded-4xl bg-gradient-to-br from-brand-50 to-brand-200 p-6 shadow-soft-lg">
                    <div className="flex h-full flex-col justify-end">
                      <Bag size={36} className="text-brand-700" />
                      <p className="mt-3 text-sm font-semibold text-brand-900">Surprise Bag</p>
                      <p className="text-xs text-brand-700">Veggie Mezze · Green Bistro</p>
                    </div>
                  </div>
                  <div className="aspect-[4/3] rounded-4xl bg-ink p-6 text-white shadow-soft-md">
                    <p className="text-3xl font-bold tracking-tight">55%</p>
                    <p className="mt-1 text-sm text-white/60">avg. saving vs. menu price</p>
                  </div>
                </div>
                <div className="space-y-4 pt-6">
                  <div className="aspect-[4/3] rounded-4xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-soft-md">
                    <Wallet size={28} className="text-amber-700" />
                    <p className="mt-3 text-xl font-semibold text-amber-900">$120+</p>
                    <p className="text-xs text-amber-700">saved per month</p>
                  </div>
                  <div className="aspect-square rounded-4xl bg-gradient-to-br from-rose-50 to-rose-100 p-6 shadow-soft-lg">
                    <Leaf size={36} className="text-rose-600" />
                    <p className="mt-3 text-sm font-semibold text-rose-900">2.4 kg CO₂</p>
                    <p className="text-xs text-rose-700">saved per rescue</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-soft-md ring-1 ring-gray-100">
                <span className="text-brand-600">●</span> Live demo available now
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT BANNER */}
      <section className="border-y border-gray-100 bg-ink text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
          {IMPACT.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      {showFeatured && (
        <section className="section">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="chip"><Sparkles size={14} /> Featured today</span>
                <h2 className="mt-3 heading-display text-3xl md:text-4xl">Fresh surplus near you</h2>
                <p className="mt-2 text-ink-muted">Hand-picked listings from partner restaurants.</p>
              </div>
              <Link to="/register" className="hidden md:inline-flex btn-secondary">
                Browse all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured!.slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY MARQUEE */}
      <section className="overflow-hidden border-y border-gray-100 bg-brand-50/40 py-4">
        <div className="marquee-mask">
          <div className="flex w-max animate-marquee gap-3 pr-3">
            {[...CUISINES, ...CUISINES].map((c, i) => (
              <span
                key={i}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-soft shadow-soft ring-1 ring-gray-100"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip mx-auto"><Bag size={14} /> How to use ResQBite</span>
            <h2 className="mt-3 heading-display text-3xl md:text-4xl">Rescue food in <span className="text-brand-700">four</span> simple steps</h2>
            <p className="mt-3 text-ink-muted">From discovery to a finished meal — seamless and fast.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-12 top-12 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-brand-300 to-brand-100 md:block" />
                )}
                <div className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-brand">
                  {s.icon}
                </div>
                <div className="mt-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    Step {s.n}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS TRIO */}
      <section className="section bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip mx-auto"><Wallet size={14} /> Why use ResQBite</span>
            <h2 className="mt-3 heading-display text-3xl md:text-4xl">Eat well, save money, save the planet</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: <Wallet size={26} />, title: "Half price or less", text: "Quality meals from local restaurants at deep discounts — typically 30–70% off." },
              { icon: <MapPin size={26} />, title: "Food right near you", text: "Discover surplus listings from stores and restaurants in your neighbourhood." },
              { icon: <Leaf size={26} />, title: "Cut food waste", text: "Every rescue prevents emissions — be the change, one bag at a time." },
            ].map((c) => (
              <div key={c.title} className="card p-8 transition hover:-translate-y-1 hover:shadow-soft-md">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  {c.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER CTA */}
      <section className="section">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 to-brand-900 p-10 md:p-16">
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-16 -left-8 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <div className="relative grid items-center gap-10 md:grid-cols-3">
              <div className="md:col-span-2">
                <span className="chip bg-white/10 text-white ring-white/20"><Store size={14} /> For restaurants</span>
                <h2 className="mt-4 heading-display text-3xl text-white md:text-4xl">
                  Turn surplus into revenue
                </h2>
                <p className="mt-3 max-w-xl text-white/70">
                  ResQBite helps your restaurant recover value from unsold food,
                  attract new customers, and demonstrate your commitment to
                  sustainability — no extra hardware required.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/register?role=restaurant">
                    <Button variant="dark" size="lg">Become a partner <ArrowRight size={18} /></Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button variant="secondary" size="lg">See how it works</Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                    <Store size={28} className="text-white" />
                    <p className="mt-3 text-2xl font-bold text-white">+38%</p>
                    <p className="text-xs text-white/60">revenue from surplus</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                    <Check size={28} className="text-white" />
                    <p className="mt-3 text-2xl font-bold text-white">0 ZŁ</p>
                    <p className="text-xs text-white/60">setup cost</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}