"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import type { DownloadState } from "@/hooks/use-download";

export function DownloadProgress({ state }: { state: DownloadState }) {
  if (state.status === "idle") return null;

  if (state.status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <span className="text-destructive-foreground/90 break-words">
          {state.error || "Something went wrong."}
        </span>
      </div>
    );
  }

  if (state.status === "done") {
    return (
      <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4 text-primary" />
          Ready
        </div>
        {state.file && (
          <p className="truncate text-xs text-muted-foreground" title={state.file}>
            {state.file}
          </p>
        )}
        {state.downloadUrl && (
          <Button
            className="w-full"
            render={<a href={state.downloadUrl} download />}
          >
            <Download className="size-4" />
            Save to your computer
          </Button>
        )}
      </div>
    );
  }

  // running
  const showBar = state.percent > 0 && !state.message;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" />
          {state.message || `Downloading… ${state.percent.toFixed(1)}%`}
        </span>
        {showBar && (
          <span className="tabular-nums">
            {state.speed} {state.eta && `· ETA ${state.eta}`}
          </span>
        )}
      </div>
      <Progress value={state.message ? null : state.percent} />
    </div>
  );
}
