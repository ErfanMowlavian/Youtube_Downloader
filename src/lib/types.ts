export interface VideoQuality {
  selector: string;
  label: string;
  height: number;
  ext: string;
  fps?: number;
  filesize?: number | null;
}

export interface SubtitleTrack {
  lang: string;
  name: string;
  auto: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  channel: string;
  channelUrl?: string;
  duration: number;
  durationString: string;
  viewCount?: number;
  likeCount?: number;
  uploadDate?: string;
  description: string;
  thumbnail: string;
  webpageUrl: string;
  isLive?: boolean;
  qualities: VideoQuality[];
  subtitles: SubtitleTrack[];
}

export type ProgressEvent =
  | { type: "progress"; percent: number; speed: string; eta: string }
  | { type: "status"; message: string }
  | { type: "done"; file: string | null; downloadUrl?: string }
  | { type: "error"; message: string };
