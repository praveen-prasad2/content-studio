"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspace-store";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = redo. */
export function useUndoHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      const { past, future, undo, redo } = useWorkspaceStore.getState();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (!past.length) return;
        undo();
        toast("Undone", { duration: 1200 });
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        if (!future.length) return;
        redo();
        toast("Redone", { duration: 1200 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
