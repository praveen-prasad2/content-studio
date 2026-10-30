import { NextResponse } from "next/server";

/**
 * Lists reels for the Instagram account that owns INSTAGRAM_ACCESS_TOKEN
 * (Instagram API with Instagram Login, professional accounts). Instagram only
 * exposes media for accounts you have a token for — it can't list other people's reels.
 */

export const dynamic = "force-dynamic";

/** Instagram responses are cached for 10 minutes. */
const CACHE_SECONDS = 600;

type GraphMedia = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS" | "STORY" | "AD";
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
};

export type InstagramApiResponse =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true;
      username: string;
      reels: { id: string; permalink: string; thumbnail?: string; caption: string; timestamp: string; likes?: number; comments?: number }[];
    };

const GRAPH = "https://graph.instagram.com/v21.0";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return NextResponse.json<InstagramApiResponse>({ configured: false });

  try {
    const fields = "id,media_type,media_product_type,permalink,thumbnail_url,media_url,caption,timestamp,like_count,comments_count";
    const [meRes, mediaRes] = await Promise.all([
      fetch(`${GRAPH}/me?fields=username&access_token=${encodeURIComponent(token)}`, { next: { revalidate: CACHE_SECONDS } }),
      fetch(`${GRAPH}/me/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`, { next: { revalidate: CACHE_SECONDS } }),
    ]);
    if (!meRes.ok || !mediaRes.ok) {
      const body = (await (meRes.ok ? mediaRes : meRes).json().catch(() => null)) as { error?: { message?: string } } | null;
      return NextResponse.json<InstagramApiResponse>({ configured: true, error: body?.error?.message ?? "Instagram API request failed" }, { status: 502 });
    }
    const me = (await meRes.json()) as { username: string };
    const media = (await mediaRes.json()) as { data: GraphMedia[] };
    const reels = media.data
      .filter((m) => m.media_product_type === "REELS" || m.media_type === "VIDEO")
      .map((m) => ({
        id: m.id,
        permalink: m.permalink,
        thumbnail: m.thumbnail_url ?? m.media_url,
        caption: m.caption ?? "",
        timestamp: m.timestamp,
        likes: m.like_count,
        comments: m.comments_count,
      }));
    return NextResponse.json<InstagramApiResponse>({ configured: true, username: me.username, reels });
  } catch {
    return NextResponse.json<InstagramApiResponse>({ configured: true, error: "Couldn't reach the Instagram API" }, { status: 502 });
  }
}
