import { useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { MapPin, Search } from "@/components/icons";
import { CITIES, searchCities, type City } from "@/lib/cities";
import {
  buildLocationFromCity,
  locationFromCoords,
  type CustomerLocation,
} from "@/lib/location";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (location: CustomerLocation) => void;
  initial?: CustomerLocation | null;
}

type GeoStatus = "idle" | "loading" | "success" | "denied" | "error";

export default function LocationPickerModal({ open, onClose, onPick, initial }: Props) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoError, setGeoError] = useState<string | null>(null);

  // Reset transient state every time the modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlighted(0);
      setGeoStatus("idle");
      setGeoError(null);
    }
  }, [open]);

  const suggestions = useMemo(() => searchCities(query, 8), [query]);

  const requestGps = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }
    setGeoStatus("loading");
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = locationFromCoords(pos.coords.latitude, pos.coords.longitude);
        setGeoStatus("success");
        onPick(loc);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
          setGeoError("Permission denied. You can pick a city manually instead.");
        } else {
          setGeoStatus("error");
          setGeoError(err.message || "Could not get your location.");
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const pickCity = (c: City) => {
    onPick(buildLocationFromCity(c));
  };

  return (
    <Modal
      open={open}
      title={initial ? "Change your location" : "Where are you?"}
      onClose={onClose}
    >
      <p className="-mt-2 mb-5 text-sm text-ink-muted">
        We use your city to show listings near you. You can use GPS for accuracy or pick a city manually.
      </p>

      {/* GPS button */}
      <Button
        variant="primary"
        className="btn-block btn-lg"
        loading={geoStatus === "loading"}
        onClick={requestGps}
      >
        <MapPin size={18} /> Use my location
      </Button>

      {geoStatus === "denied" && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
          {geoError}
        </p>
      )}
      {geoStatus === "error" && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {geoError}
        </p>
      )}

      {/* Divider */}
      <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
        <div className="h-px flex-1 bg-gray-100" />
        <span>or pick a city</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {/* Manual city search */}
      <Input
        label="City"
        name="city"
        placeholder="Search cities (e.g. Istanbul, Ankara…)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
        }}
        leftIcon={<Search size={16} />}
        autoFocus
        aria-label="Search for a city"
      />

      {suggestions.length > 0 && (
        <ul className="mt-2 max-h-60 overflow-y-auto rounded-2xl ring-1 ring-gray-100">
          {suggestions.map((c, idx) => {
            const selected = idx === highlighted;
            return (
              <li key={c.name}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => pickCity(c)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                    selected ? "bg-brand-50 text-brand-700" : "hover:bg-gray-50 text-ink"
                  }`}
                >
                  <MapPin size={14} className="text-ink-muted" />
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-auto text-xs text-ink-muted">
                    {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query && suggestions.length === 0 && (
        <p className="mt-2 text-xs text-ink-muted">
          No matches. Try one of: {CITIES.slice(0, 6).map((c) => c.name).join(", ")}…
        </p>
      )}

      {initial && (
        <p className="mt-5 text-xs text-ink-muted">
          Current: <span className="font-semibold text-ink">{initial.city}</span>
          {initial.coords && " (via GPS)"} — pick another to change.
        </p>
      )}
    </Modal>
  );
}