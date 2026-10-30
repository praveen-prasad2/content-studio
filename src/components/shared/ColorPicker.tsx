"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ACCENT_SWATCHES } from "@/data/workers";
import { Input } from "@/components/ui/fields";
import { cn, isValidHex } from "@/lib/utils";

export function ColorPicker({ value, onChange, label = "Accent color" }: { value: string; onChange: (hex: string) => void; label?: string }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {ACCENT_SWATCHES.map((c) => {
          const selected = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c}
              onClick={() => onChange(c)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90",
                selected && "ring-2 ring-white ring-offset-2 ring-offset-[#0f0f16]",
              )}
              style={{ background: c }}
            >
              {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/10" style={{ background: value }}>
          <span className="sr-only">Pick a custom color</span>
          <input type="color" value={isValidHex(value) && value.length === 7 ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <Input
          aria-label="Custom hex color"
          value={hex}
          onChange={(e) => {
            setHex(e.target.value);
            if (isValidHex(e.target.value)) onChange(e.target.value);
          }}
          placeholder="#A855F7"
          className="font-mono"
        />
      </div>
    </div>
  );
}
