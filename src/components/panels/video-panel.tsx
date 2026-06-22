"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { VideoInfo } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { useDownload } from "@/hooks/use-download";
import { DownloadProgress } from "@/components/download-progress";

export function VideoPanel({ info }: { info: VideoInfo }) {
  const { state, start } = useDownload();
  const [selector, setSelector] = useState(
    info.qualities[0]?.selector ?? "bestvideo+bestaudio/best"
  );
  const running = state.status === "running";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Quality
        </label>
        <Select
          value={selector}
          onValueChange={(v) => v && setSelector(v)}
          disabled={running}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose quality" />
          </SelectTrigger>
          <SelectContent>
            {info.qualities.length === 0 && (
              <SelectItem value="bestvideo+bestaudio/best">
                Best available
              </SelectItem>
            )}
            {info.qualities.map((q) => (
              <SelectItem key={q.label} value={q.selector}>
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="font-medium">{q.label}</span>
                  <span className="text-xs text-muted-foreground">
                    mp4 {q.filesize ? `· ~${formatBytes(q.filesize)}` : ""}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={running}
        onClick={() => start({ url: info.webpageUrl, mode: "video", selector })}
      >
        <Download className="size-4" />
        {running ? "Downloading…" : "Download video"}
      </Button>

      <DownloadProgress state={state} />
    </div>
  );
}
