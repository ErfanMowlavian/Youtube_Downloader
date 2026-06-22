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
import { Music } from "lucide-react";
import type { VideoInfo } from "@/lib/types";
import { useDownload } from "@/hooks/use-download";
import { DownloadProgress } from "@/components/download-progress";

const FORMATS = [
  { value: "mp3", label: "MP3 — most compatible" },
  { value: "m4a", label: "M4A (AAC) — better quality/size" },
  { value: "opus", label: "Opus — best efficiency" },
  { value: "wav", label: "WAV — lossless, large" },
];

const QUALITIES = [
  { value: "0", label: "Best available" },
  { value: "320", label: "320 kbps" },
  { value: "256", label: "256 kbps" },
  { value: "192", label: "192 kbps" },
  { value: "128", label: "128 kbps" },
];

export function AudioPanel({ info }: { info: VideoInfo }) {
  const { state, start } = useDownload();
  const [audioFormat, setAudioFormat] = useState("mp3");
  const [audioQuality, setAudioQuality] = useState("0");
  const running = state.status === "running";
  const lossless = audioFormat === "wav";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Format
          </label>
          <Select
            value={audioFormat}
            onValueChange={(v) => v && setAudioFormat(v)}
            disabled={running}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Bitrate
          </label>
          <Select
            value={lossless ? "0" : audioQuality}
            onValueChange={(v) => v && setAudioQuality(v)}
            disabled={running || lossless}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUALITIES.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={running}
        onClick={() =>
          start({
            url: info.webpageUrl,
            mode: "audio",
            audioFormat,
            audioQuality,
          })
        }
      >
        <Music className="size-4" />
        {running ? "Extracting…" : "Extract audio"}
      </Button>

      <DownloadProgress state={state} />
    </div>
  );
}
