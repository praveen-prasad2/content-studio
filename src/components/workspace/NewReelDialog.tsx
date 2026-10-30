"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { THUMBNAIL_CHOICES } from "@/data/reels";
import { useWorkspaceStore } from "@/store/workspace-store";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { cn } from "@/lib/utils";

/** Downscale an uploaded image to a 9:16 JPEG so it fits comfortably in localStorage. */
function fileToThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const w = 270;
        const h = 480;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function NewReelDialog() {
  const open = useWorkspaceStore((s) => s.newReelOpen);
  const setOpen = useWorkspaceStore((s) => s.setNewReelOpen);
  const addReel = useWorkspaceStore((s) => s.addReel);
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [thumbnail, setThumbnail] = useState<string>(THUMBNAIL_CHOICES[0]);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setHook("");
    setThumbnail(THUMBNAIL_CHOICES[0]);
    setUploaded(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addReel({ title, hook, thumbnail });
    toast.success("Reel added to the task queue", { description: "Research will pick it up next." });
    reset();
    setOpen(false);
  };

  const choices = uploaded ? [uploaded, ...THUMBNAIL_CHOICES] : THUMBNAIL_CHOICES;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New reel</DialogTitle>
            <DialogDescription>Drop an idea into the task queue. The team takes it from there.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nr-title">Title</Label>
              <Input id="nr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3 habits that changed my mornings" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nr-hook">Hook</Label>
              <Textarea id="nr-hook" value={hook} onChange={(e) => setHook(e.target.value)} placeholder="The first 3 seconds — what makes people stop scrolling?" className="min-h-[64px]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Thumbnail</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload /> Upload
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload thumbnail"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await fileToThumbnail(file);
                      setUploaded(data);
                      setThumbnail(data);
                    } catch {
                      toast.error("Couldn't read that image");
                    }
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Thumbnail">
                {choices.map((src, i) => (
                  <button
                    key={src.slice(0, 80) + i}
                    type="button"
                    role="radio"
                    aria-checked={thumbnail === src}
                    aria-label={`Thumbnail ${i + 1}`}
                    onClick={() => setThumbnail(src)}
                    className={cn(
                      "relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 transition-transform active:scale-95",
                      thumbnail === src && "ring-2 ring-accent ring-offset-2 ring-offset-[#111118]",
                    )}
                  >
                    <ReelThumb src={src} seed={`choice-${i}`} rate={0} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add to queue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
