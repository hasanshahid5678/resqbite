import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, Button, Input, Select, Textarea } from "@/components/ui";
import { ArrowLeft } from "@/components/icons";
import { useToast } from "@/context/ToastContext";
import { createListing, getListing, updateListing, type ListingCreate } from "@/api/listings";
import { restaurantNav } from "@/lib/nav";
import { toLocalInputValue } from "@/lib/format";

const CATEGORIES = ["Pizza", "Pasta", "Mezze", "Soup", "Salad", "Dessert", "Bakery", "Coffee", "Burgers", "Vegan", "Other"];

export default function ListingForm() {
  const { id } = useParams();
  const listingId = id ? Number(id) : null;
  const isEdit = listingId !== null;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<ListingCreate>({
    title: "",
    description: "",
    category: CATEGORIES[0],
    original_price: "0",
    discounted_price: "0",
    quantity: 1,
    pickup_start: toLocalInputValue(new Date(Date.now() + 3600_000).toISOString()),
    pickup_end: toLocalInputValue(new Date(Date.now() + 5 * 3600_000).toISOString()),
    expires_at: toLocalInputValue(new Date(Date.now() + 6 * 3600_000).toISOString()),
    image_data: null,
  });
  const [uploading, setUploading] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => getListing(listingId as number),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? "",
        category: existing.category,
        original_price: String(existing.original_price),
        discounted_price: String(existing.discounted_price),
        quantity: existing.quantity,
        pickup_start: toLocalInputValue(existing.pickup_start),
        pickup_end: toLocalInputValue(existing.pickup_end),
        expires_at: toLocalInputValue(existing.expires_at),
        image_data: existing.image_data,
      });
    }
  }, [existing]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      if (file.size > 800 * 1024) {
        toast("Image must be smaller than 800 KB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setForm((f) => ({ ...f, image_data: String(reader.result) }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: ListingCreate = {
        ...form,
        pickup_start: new Date(form.pickup_start).toISOString(),
        pickup_end: new Date(form.pickup_end).toISOString(),
        expires_at: new Date(form.expires_at).toISOString(),
      };
      if (isEdit && listingId !== null) {
        return updateListing(listingId, payload);
      }
      return createListing(payload);
    },
    onSuccess: () => {
      toast(isEdit ? "Listing updated" : "Listing created", "success");
      qc.invalidateQueries({ queryKey: ["listings", "me"] });
      navigate("/restaurant/listings");
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || "Could not save listing";
      toast(typeof msg === "string" ? msg : "Validation error", "error");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <DashboardLayout title="Restaurant" sections={restaurantNav}>
      <button onClick={() => navigate("/restaurant/listings")} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
        <ArrowLeft size={16} /> Back to listings
      </button>
      <div className="mt-2">
        <span className="chip"><EditIcon /> {isEdit ? "Edit listing" : "New listing"}</span>
        <h1 className="mt-2 heading-display text-2xl md:text-3xl">{isEdit ? "Edit listing" : "Create a new listing"}</h1>
        <p className="mt-1 text-sm text-ink-muted">Set the title, pricing, and pickup window for your surplus item.</p>
      </div>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <Input label="Title" name="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Category" id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="md:col-span-2">
            <Textarea label="Description" id="description" rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's in the bag? What's special about it?" />
          </div>
          <Input label="Original price" type="number" step="0.01" min="0" required value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
          <Input label="Discounted price" type="number" step="0.01" min="0" required value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} hint="Must be less than the original price" />
          <Input label="Quantity" type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <Input label="Pickup start" type="datetime-local" required value={form.pickup_start} onChange={(e) => setForm({ ...form, pickup_start: e.target.value })} />
          <Input label="Pickup end" type="datetime-local" required value={form.pickup_end} onChange={(e) => setForm({ ...form, pickup_end: e.target.value })} />
          <Input label="Expires at" type="datetime-local" required value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />

          <div className="md:col-span-2">
            <label className="label">Listing image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="input file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
            />
            <p className="mt-1.5 text-xs text-ink-muted">JPG or PNG up to 800 KB.</p>
            {form.image_data && (
              <img src={form.image_data} alt="preview" className="mt-3 h-32 w-32 rounded-2xl object-cover ring-1 ring-gray-100" />
            )}
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/restaurant/listings")}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>{isEdit ? "Save changes" : "Publish listing"}</Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}

function EditIcon() {
  return <span>✏️</span>;
}