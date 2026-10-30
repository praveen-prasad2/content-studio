"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_SRC = "https://www.instagram.com/embed.js";
let scriptPromise: Promise<void> | null = null;

/** Loads Instagram's official embed script once per page. */
function loadEmbedScript() {
  if (window.instgrm) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Instagram embed script failed to load"));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Renders a reel with Instagram's official embed (the same player Instagram's
 * "Embed" option produces). Respects the owner's embed settings.
 */
export function InstagramEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    let mo: MutationObserver | undefined;
    let timer: number | undefined;
    setState("loading");
    loadEmbedScript()
      .then(() => {
        const el = ref.current;
        if (cancelled || !el) return;
        // The script swaps the blockquote for an iframe; watch for it.
        const check = () => {
          if (el.querySelector("iframe")) setState("ready");
        };
        mo = new MutationObserver(check);
        mo.observe(el, { childList: true, subtree: true });
        window.instgrm?.Embeds.process();
        check();
        timer = window.setTimeout(() => {
          if (!el.querySelector("iframe")) setState("failed");
        }, 12_000);
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
      mo?.disconnect();
      window.clearTimeout(timer);
    };
  }, [url]);

  return (
    <div ref={ref} className="relative min-h-[420px] overflow-hidden rounded-2xl bg-white/[0.03]">
      {state === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {state === "failed" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0f0f16] p-6 text-center text-sm text-muted">
          <p>This reel couldn&apos;t be embedded (it may be private, removed, or have embedding turned off).</p>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
            Open on Instagram <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
      <blockquote
        key={url}
        className="instagram-media"
        data-instgrm-permalink={`${url}?utm_source=ig_embed`}
        data-instgrm-version="14"
        style={{ background: "#fff", border: 0, borderRadius: 16, margin: 0, maxWidth: 540, minWidth: 280, width: "100%" }}
      >
        <a href={url} target="_blank" rel="noreferrer">
          View this reel on Instagram
        </a>
      </blockquote>
    </div>
  );
}
