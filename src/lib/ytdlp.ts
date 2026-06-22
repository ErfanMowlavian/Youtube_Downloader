import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

/** Resolve the yt-dlp / ffmpeg binaries even when PATH is minimal (GUI launch). */
const EXTRA_PATHS = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  path.join(os.homedir(), ".local/bin"),
];

function resolveBin(name: string): string {
  for (const dir of EXTRA_PATHS) {
    const p = path.join(dir, name);
    if (existsSync(p)) return p;
  }
  return name; // fall back to PATH lookup
}

export const YT_DLP = resolveBin("yt-dlp");
export const FFMPEG_DIR =
  EXTRA_PATHS.find((d) => existsSync(path.join(d, "ffmpeg"))) ?? "";

/** Build env with the extra paths merged into PATH so spawned children find ffmpeg. */
function childEnv(): NodeJS.ProcessEnv {
  const extra = EXTRA_PATHS.join(":");
  return {
    ...process.env,
    PATH: `${extra}:${process.env.PATH ?? ""}`,
  };
}

/** Downloads land here (project-root /downloads). */
export const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");

export interface VideoQuality {
  /** yt-dlp format selector, e.g. "bestvideo[height<=1080]+bestaudio/best" */
  selector: string;
  label: string; // "1080p"
  height: number;
  ext: string;
  fps?: number;
  filesize?: number | null;
}

export interface SubtitleTrack {
  lang: string; // "en"
  name: string; // "English"
  auto: boolean; // true = auto-generated caption
}

export interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  channel: string;
  channelUrl?: string;
  duration: number; // seconds
  durationString: string;
  viewCount?: number;
  likeCount?: number;
  uploadDate?: string; // YYYYMMDD
  description: string;
  thumbnail: string;
  webpageUrl: string;
  isLive?: boolean;
  qualities: VideoQuality[];
  subtitles: SubtitleTrack[];
}

interface RawFormat {
  format_id: string;
  ext: string;
  height?: number | null;
  width?: number | null;
  vcodec?: string;
  acodec?: string;
  fps?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
}

interface RawInfo {
  id: string;
  title: string;
  uploader?: string;
  channel?: string;
  channel_url?: string;
  duration?: number;
  duration_string?: string;
  view_count?: number;
  like_count?: number;
  upload_date?: string;
  description?: string;
  thumbnail?: string;
  webpage_url: string;
  is_live?: boolean;
  formats?: RawFormat[];
  subtitles?: Record<string, unknown[]>;
  automatic_captions?: Record<string, unknown[]>;
}

function fmtDuration(sec: number): string {
  if (!sec || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? h + ":" : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Turn raw formats into a deduped, sorted list of selectable video qualities. */
function deriveQualities(formats: RawFormat[]): VideoQuality[] {
  const byHeight = new Map<number, RawFormat>();
  for (const f of formats) {
    if (!f.height || f.vcodec === "none") continue;
    const existing = byHeight.get(f.height);
    // prefer mp4 for compatibility, then larger filesize as a quality proxy
    if (!existing || (existing.ext !== "mp4" && f.ext === "mp4")) {
      byHeight.set(f.height, f);
    }
  }
  const list: VideoQuality[] = [...byHeight.values()]
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .map((f) => ({
      // prefer h264+aac in a real mp4 (QuickTime-friendly), then fall back to any
      selector: `bestvideo[height<=${f.height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${f.height}]+bestaudio/best[height<=${f.height}]`,
      label: `${f.height}p${f.fps && f.fps >= 50 ? f.fps : ""}`,
      height: f.height as number,
      ext: "mp4",
      fps: f.fps ?? undefined,
      filesize: f.filesize ?? f.filesize_approx ?? null,
    }));
  return list;
}

function deriveSubs(raw: RawInfo): SubtitleTrack[] {
  const out: SubtitleTrack[] = [];
  const seen = new Set<string>();
  const add = (langs: Record<string, unknown[]> | undefined, auto: boolean) => {
    if (!langs) return;
    for (const lang of Object.keys(langs)) {
      // skip the huge machine-translated list for auto captions except base langs
      if (auto && lang.includes("-")) continue;
      const key = `${lang}|${auto}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ lang, name: langToName(lang), auto });
    }
  };
  add(raw.subtitles, false);
  add(raw.automatic_captions, true);
  // sort: manual first, English-ish first
  return out.sort((a, b) => {
    if (a.auto !== b.auto) return a.auto ? 1 : -1;
    if (a.lang.startsWith("en") !== b.lang.startsWith("en"))
      return a.lang.startsWith("en") ? -1 : 1;
    return a.lang.localeCompare(b.lang);
  });
}

let dn: Intl.DisplayNames | null = null;
function langToName(code: string): string {
  try {
    dn ??= new Intl.DisplayNames(["en"], { type: "language" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Run yt-dlp and collect full stdout (for JSON dumps). Rejects on non-zero exit. */
export function runJson(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP, args, { env: childEnv() });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err.trim() || `yt-dlp exited with code ${code}`));
    });
  });
}

export async function getInfo(url: string): Promise<VideoInfo> {
  const out = await runJson([
    "--dump-single-json",
    "--no-warnings",
    "--no-playlist",
    url,
  ]);
  const raw = JSON.parse(out) as RawInfo;
  return {
    id: raw.id,
    title: raw.title,
    uploader: raw.uploader ?? raw.channel ?? "Unknown",
    channel: raw.channel ?? raw.uploader ?? "Unknown",
    channelUrl: raw.channel_url,
    duration: raw.duration ?? 0,
    durationString: raw.duration_string ?? fmtDuration(raw.duration ?? 0),
    viewCount: raw.view_count,
    likeCount: raw.like_count,
    uploadDate: raw.upload_date,
    description: raw.description ?? "",
    thumbnail: raw.thumbnail ?? "",
    webpageUrl: raw.webpage_url,
    isLive: raw.is_live,
    qualities: deriveQualities(raw.formats ?? []),
    subtitles: deriveSubs(raw),
  };
}

/** Spawn yt-dlp for a download, exposing the raw child process for streaming. */
export function spawnYtDlp(args: string[]) {
  return spawn(YT_DLP, args, { env: childEnv() });
}
