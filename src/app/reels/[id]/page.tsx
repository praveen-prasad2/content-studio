"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { selectReel, useWorkspaceStore } from "@/store/workspace-store";
import { PageContainer } from "@/components/layout/AppShell";
import { ReelDetail } from "@/components/reels/ReelDetail";
import { Button } from "@/components/ui/button";

export default function ReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const reel = useWorkspaceStore(selectReel(id));

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/reels">
          <ArrowLeft /> All reels
        </Link>
      </Button>
      {reel ? (
        <ReelDetail reel={reel} />
      ) : (
        <div className="glass-card mx-auto mt-10 max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold">Reel not found</h1>
          <p className="mt-1 text-sm text-muted">It may have been archived after finishing the pipeline.</p>
        </div>
      )}
    </PageContainer>
  );
}
