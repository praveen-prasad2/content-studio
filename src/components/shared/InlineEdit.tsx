"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type InlineEditProps = {
  value: string;
  onSave: (value: string) => void;
  label: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
};

/** Double-click (or press Enter/F2 when focused) to edit. Enter saves, Esc cancels. */
export function InlineEdit({ value, onSave, label, className, inputClassName, multiline, placeholder, children }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onSave(next);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    const shared = {
      ref,
      value: draft,
      "aria-label": label,
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Enter" && (!multiline || !e.shiftKey)) {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      },
      onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
      className: cn(
        "w-full rounded-md border border-accent/50 bg-black/40 px-1.5 py-0.5 text-inherit outline-none ring-2 ring-accent/20",
        inputClassName,
      ),
    };
    return multiline ? <textarea rows={3} {...shared} /> : <input {...shared} />;
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Double-click to edit"
      aria-label={`${label}: ${value}. Press Enter to edit.`}
      onDoubleClick={start}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "F2") {
          e.preventDefault();
          e.stopPropagation();
          start();
        }
      }}
      className={cn("cursor-text rounded-md decoration-white/30 underline-offset-4 hover:underline hover:decoration-dotted", className)}
    >
      {children ?? value}
    </span>
  );
}
