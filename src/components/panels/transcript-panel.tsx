"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { VideoInfo } from "@/lib/types";

const FORMATS = [
  { value: "txt", label: "Plain text" },
  { value: "txt-timestamped", label: "Text with timestamps" },
  { value: "srt", label: "SubRip (.srt)" },
  { value: "vtt", label: "WebVTT (.vtt)" },
];

interface Result {
  content: string;
  preview: string;
  downloadUrl: string;
  file: string;
  wordCount: number;
  cueCount: number;
}

export function TranscriptPanel({ info }: { info: VideoInfo }) {
  const subs = info.subtitles;
  const [trackKey, setTrackKey] = useState(
    subs[0] ? `${subs[0].lang}|${subs[0].auto}` : ""
  );
  const [format, setFormat] = useState("txt");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const track = useMemo(
    () => subs.find((s) => `${s.lang}|${s.auto}` === trackKey),
    [subs, trackKey]
  );

  // value -> label map so the trigger shows "English" / "English (auto)"
  const langItems = useMemo(
    () =>
      subs.map((s) => ({
        value: `${s.lang}|${s.auto}`,
        label: s.auto ? `${s.name} (auto)` : s.name,
      })),
    [subs]
  );

  if (subs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No subtitles or captions are available for this video.
      </div>
    );
  }

  async function getTranscript() {
    if (!track) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: info.webpageUrl,
          lang: track.lang,
          auto: track.auto,
          format,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get transcript");
      setResult(data as Result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get transcript");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Language
          </label>
          <Select
            value={trackKey}
            onValueChange={(v) => v && setTrackKey(v)}
            items={langItems}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose language" />
            </SelectTrigger>
            <SelectContent>
              {subs.map((s) => (
                <SelectItem key={`${s.lang}|${s.auto}`} value={`${s.lang}|${s.auto}`}>
                  <span className="flex items-center gap-2">
                    {s.name}
                    {s.auto && (
                      <Badge variant="secondary" className="text-[10px]">
                        auto
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Format
          </label>
          <Select
            value={format}
            onValueChange={(v) => v && setFormat(v)}
            items={FORMATS}
            disabled={loading}
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
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={loading}
        onClick={getTranscript}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        {loading ? "Fetching transcript…" : "Get transcript"}
      </Button>

      {result && (
        <div className="space-y-3 rounded-lg border bg-card/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {result.wordCount.toLocaleString()} words · {result.cueCount} cues
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={copy}>
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy
              </Button>
              <Button
                size="sm"
                render={<a href={result.downloadUrl} download />}
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
          <ScrollArea className="h-64 w-full rounded-md border bg-background/50 p-3">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/90">
              {result.content}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
