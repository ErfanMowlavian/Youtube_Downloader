"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Loader2, Music, Search, Video } from "lucide-react";
import { toast } from "sonner";
import type { VideoInfo } from "@/lib/types";
import { VideoPreview } from "@/components/video-preview";
import { VideoPanel } from "@/components/panels/video-panel";
import { TranscriptPanel } from "@/components/panels/transcript-panel";
import { AudioPanel } from "@/components/panels/audio-panel";

export function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<VideoInfo | null>(null);

  async function fetchInfo(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setInfo(null);
    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch video");
      setInfo(data as VideoInfo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch video");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={fetchInfo} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a YouTube (or other) video URL…"
              className="h-11 flex-1 text-base"
              autoFocus
              inputMode="url"
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 px-6"
              disabled={loading || !url.trim()}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Fetch
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && <LoadingCard />}

      {info && !loading && (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <VideoPreview info={info} />

            <Tabs defaultValue="video" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video">
                  <Video className="size-4" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="transcript">
                  <FileText className="size-4" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Music className="size-4" />
                  Audio
                </TabsTrigger>
              </TabsList>
              <TabsContent value="video" className="pt-4">
                <VideoPanel info={info} />
              </TabsContent>
              <TabsContent value="transcript" className="pt-4">
                <TranscriptPanel info={info} />
              </TabsContent>
              <TabsContent value="audio" className="pt-4">
                <AudioPanel info={info} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="aspect-video w-full rounded-lg sm:w-64" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
