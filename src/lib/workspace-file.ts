"use client";

import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspace-store";

export function downloadWorkspace() {
  const data = useWorkspaceStore.getState().exportWorkspace();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = data.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  a.href = url;
  a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Workspace exported");
}

export async function importWorkspaceFile(file: File) {
  try {
    const parsed: unknown = JSON.parse(await file.text());
    const ok = useWorkspaceStore.getState().importWorkspace(parsed);
    if (ok) toast.success("Workspace imported");
    else toast.error("That file isn't a Content Studio workspace export");
    return ok;
  } catch {
    toast.error("Couldn't read that file — is it valid JSON?");
    return false;
  }
}
