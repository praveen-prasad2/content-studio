import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Matches instagram.com/reel/CODE, /reels/CODE, /p/CODE and /tv/CODE (with or without a username prefix). */
const REEL_URL = /instagram\.com\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]+)/i;

/** Returns the canonical embed URL for an Instagram post/reel link, or null if it isn't one. */
export function normalizeReelUrl(input: string): string | null {
  const match = input.trim().match(REEL_URL);
  return match ? `https://www.instagram.com/reel/${match[1]}/` : null;
}

export function extractReelUrls(text: string) {
  const found = text
    .split(/[\s,]+/)
    .map(normalizeReelUrl)
    .filter((u): u is string => !!u);
  return Array.from(new Set(found));
}

/** @beegainsacademy reels shown out of the box. */
export const DEFAULT_REEL_URLS = extractReelUrls(`
  https://www.instagram.com/reel/DfCSvB-gtCk/
  https://www.instagram.com/reel/DewY-k3jg31/
  https://www.instagram.com/reels/DemDwNpAVNt/
  https://www.instagram.com/reel/DeO5Xx5iH6G/
  https://www.instagram.com/reel/DdgbomMGtNp/
  https://www.instagram.com/reel/DcyMnofAeiR/
`);

type InstagramState = {
  username: string;
  /** Reel permalinks added by hand (used when no API token is configured). */
  urls: string[];
  setUsername: (username: string) => void;
  addUrls: (urls: string[]) => number;
  removeUrl: (url: string) => void;
  moveUrl: (url: string, direction: -1 | 1) => void;
  clearUrls: () => void;
};

export const useInstagramStore = create<InstagramState>()(
  persist(
    (set, get) => ({
      username: "beegainsacademy",
      urls: DEFAULT_REEL_URLS,
      setUsername: (username) => set({ username: username.replace(/^@/, "").trim() }),
      addUrls: (urls) => {
        const existing = new Set(get().urls);
        const fresh = urls.filter((u) => !existing.has(u));
        if (fresh.length) set({ urls: [...fresh, ...get().urls] });
        return fresh.length;
      },
      removeUrl: (url) => set({ urls: get().urls.filter((u) => u !== url) }),
      moveUrl: (url, direction) => {
        const urls = [...get().urls];
        const i = urls.indexOf(url);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= urls.length) return;
        [urls[i], urls[j]] = [urls[j], urls[i]];
        set({ urls });
      },
      clearUrls: () => set({ urls: [] }),
    }),
    {
      name: "content-studio-instagram",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // v0 → v1: browsers that saved an empty list before the defaults existed get them now.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<Pick<InstagramState, "username" | "urls">>;
        if (version < 1 && !state.urls?.length) return { ...state, urls: DEFAULT_REEL_URLS };
        return state;
      },
    },
  ),
);
