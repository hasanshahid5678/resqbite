import { Minus, Plus } from "@/components/icons";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper({ value, onChange, min = 1, max = 99 }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-2xl ring-1 ring-gray-200">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="grid w-11 place-items-center text-ink-soft transition hover:bg-gray-50 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-14 border-x border-gray-200 text-center text-base font-semibold text-ink focus:outline-none"
      />
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="grid w-11 place-items-center text-ink-soft transition hover:bg-gray-50 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}