"use client";

/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ThumbsUp, Radio } from "lucide-react";
import type { VideoInfo } from "@/lib/types";
import { formatCount, formatUploadDate } from "@/lib/format";

export function VideoPreview({ info }: { info: VideoInfo }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:w-64">
        {info.thumbnail ? (
          <img
            src={info.thumbnail}
            alt={info.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No thumbnail
          </div>
        )}
        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white hover:bg-black/80">
          {info.isLive ? (
            <span className="flex items-center gap-1">
              <Radio className="size-3" /> LIVE
            </span>
          ) : (
            info.durationString
          )}
        </Badge>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
          {info.title}
        </h2>
        <p className="text-sm text-muted-foreground">{info.channel}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary" className="gap-1 font-normal">
            <Eye className="size-3" />
            {formatCount(info.viewCount)} views
          </Badge>
          {info.likeCount != null && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <ThumbsUp className="size-3" />
              {formatCount(info.likeCount)}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 font-normal">
            <Clock className="size-3" />
            {info.durationString}
          </Badge>
          {info.uploadDate && (
            <Badge variant="secondary" className="font-normal">
              {formatUploadDate(info.uploadDate)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
