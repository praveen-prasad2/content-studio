"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { selectReel, useWorkspaceStore } from "@/store/workspace-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ReelDetail, ReelTimeline } from "./ReelDetail";

export function ReelModal() {
  const openReelId = useWorkspaceStore((s) => s.openReelId);
  const reel = useWorkspaceStore(selectReel(openReelId));
  const openReel = useWorkspaceStore((s) => s.openReel);

  return (
    <Dialog open={!!reel} onOpenChange={(open) => !open && openReel(null)}>
      <DialogContent className="max-w-3xl">
        {reel && (
          <>
            <DialogTitle className="sr-only">Reel #{reel.number}</DialogTitle>
            <DialogDescription className="sr-only">Preview, copy and history for {reel.title}</DialogDescription>
            <ReelDetail reel={reel} variant="modal" />
            <div className="mt-6 grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-[1fr_auto]">
              <div>
                <h3 className="section-label mb-3">Timeline</h3>
                <ReelTimeline reel={reel} />
              </div>
              <div className="sm:self-end">
                <Button asChild variant="secondary" onClick={() => openReel(null)}>
                  <Link href={`/reels/${reel.id}`}>
                    <ExternalLink /> Open full page
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
