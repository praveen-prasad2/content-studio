"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Camera, ExternalLink, Info, Link2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { InstagramApiResponse } from "@/app/api/instagram/route";
import { extractReelUrls, useInstagramStore } from "@/store/instagram-store";
import { PageContainer } from "@/components/layout/AppShell";
import { InstagramEmbed } from "@/components/instagram/InstagramEmbed";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { Tooltip } from "@/components/ui/primitives";

const PAGE = 9;

type Api = InstagramApiResponse | { loading: true };

export default function InstagramPage() {
  const { username, urls, setUsername, addUrls, removeUrl, moveUrl, clearUrls } = useInstagramStore();
  const [api, setApi] = useState<Api>({ loading: true });
  const [draft, setDraft] = useState("");
  const [nameDraft, setNameDraft] = useState(username);
  const [shown, setShown] = useState(PAGE);
  // The setup box starts open only while there's nothing to show.
  const [formOpen, setFormOpen] = useState(() => urls.length === 0);

  const load = () => {
    setApi({ loading: true });
    fetch("/api/instagram")
      .then((r) => r.json() as Promise<InstagramApiResponse>)
      .then(setApi)
      .catch(() => setApi({ configured: true, error: "Couldn't reach the server" }));
  };
  useEffect(load, []);

  const synced = "reels" in api ? api.reels.map((r) => r.permalink) : [];
  const usingApi = synced.length > 0;
  const list = usingApi ? synced : urls;
  const profileUrl = `https://www.instagram.com/${username}/reels/`;

  const add = () => {
    const found = extractReelUrls(draft);
    if (!found.length) {
      toast.error("No Instagram reel links found", { description: "Links look like instagram.com/reel/ABC123/" });
      return;
    }
    const added = addUrls(found);
    toast.success(added ? `Added ${added} reel${added > 1 ? "s" : ""}` : "Those reels are already in the list");
    setDraft("");
  };

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient p-[2px]">
            <span className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#111118]">
              <Camera className="h-6 w-6" />
            </span>
          </span>
          <div>
            <p className="section-label">Instagram reels</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">@{"username" in api ? api.username : username}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {usingApi ? `${synced.length} reels synced from the Instagram API` : `${urls.length} reel${urls.length === 1 ? "" : "s"} added`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!usingApi && !formOpen && (
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Plus /> Add more reels
            </Button>
          )}
          {"configured" in api && api.configured && (
            <Button variant="ghost" onClick={load}>
              <RefreshCw /> Refresh
            </Button>
          )}
          <Button asChild variant="secondary">
            <a href={profileUrl} target="_blank" rel="noreferrer">
              <ExternalLink /> Open profile
            </a>
          </Button>
        </div>
      </div>

      {"error" in api && (
        <div className="glass-card !rounded-2xl border-red-500/30 p-4 text-sm text-red-200">Instagram API: {api.error}. Showing manually added reels instead.</div>
      )}

      {!usingApi && formOpen && (
        <section className="glass-card relative grid gap-5 p-5 md:grid-cols-[1fr_1.2fr] md:p-6">
          {list.length > 0 && (
            <Button variant="ghost" size="icon-sm" className="absolute right-3 top-3" aria-label="Hide the add-reels form" onClick={() => setFormOpen(false)}>
              <X />
            </Button>
          )}
          <div className="space-y-3 text-sm text-foreground/85">
            <h2 className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4 text-accent" /> How this works
            </h2>
            <p className="text-muted">
              Instagram doesn&apos;t let apps read another account&apos;s reel list without signing in, so reels are shown with Instagram&apos;s
              official embed player.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-muted">
              <li>
                Open{" "}
                <a href={profileUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  @{username}&apos;s reels
                </a>
                .
              </li>
              <li>On each reel: ⋯ → Copy link (or copy the address bar).</li>
              <li>Paste one or many links here. They&apos;re saved in this browser.</li>
            </ol>
            <p className="text-muted">
              Own this account? Set <code className="rounded bg-white/10 px-1">INSTAGRAM_ACCESS_TOKEN</code> in{" "}
              <code className="rounded bg-white/10 px-1">.env.local</code> and the reels load automatically.
            </p>
            <div className="flex items-end gap-2 pt-1">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="ig-user">Profile</Label>
                <Input id="ig-user" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="username" />
              </div>
              <Button onClick={() => setUsername(nameDraft)} disabled={nameDraft.replace(/^@/, "").trim() === username}>
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ig-links">Reel links</Label>
            <Textarea
              id="ig-links"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) add();
              }}
              placeholder={"https://www.instagram.com/reel/ABC123xyz/\nhttps://www.instagram.com/beegainsacademy/reel/DEF456/"}
              className="min-h-[140px] font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={add} className="flex-1">
                <Plus /> Add reels
              </Button>
              {urls.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    clearUrls();
                    toast("Cleared all reels");
                  }}
                >
                  <Trash2 /> Clear
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {"loading" in api ? (
        <p className="py-10 text-center text-sm text-muted">Checking for an Instagram connection…</p>
      ) : list.length ? (
        <>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(326px,1fr))]">
            {list.slice(0, shown).map((url, i) => (
              <li key={url} className="space-y-2">
                <InstagramEmbed url={url} />
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Link2 className="h-3.5 w-3.5" />
                  <a href={url} target="_blank" rel="noreferrer" className="mr-auto truncate hover:text-foreground">
                    {url.replace("https://www.", "")}
                  </a>
                  {!usingApi && (
                    <>
                      <Tooltip content="Move earlier">
                        <Button variant="ghost" size="icon-sm" aria-label="Move reel earlier" disabled={i === 0} onClick={() => moveUrl(url, -1)}>
                          <ArrowUp />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Move later">
                        <Button variant="ghost" size="icon-sm" aria-label="Move reel later" disabled={i === urls.length - 1} onClick={() => moveUrl(url, 1)}>
                          <ArrowDown />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Remove">
                        <Button variant="ghost" size="icon-sm" aria-label="Remove reel" onClick={() => removeUrl(url)}>
                          <Trash2 />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {list.length > shown && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                Load more ({list.length - shown} left)
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card p-10 text-center text-sm text-muted">No reels yet — paste some links above to display them here.</div>
      )}
    </PageContainer>
  );
}
