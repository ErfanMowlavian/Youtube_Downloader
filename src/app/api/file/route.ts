import { NextRequest } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { DOWNLOAD_DIR } from "@/lib/ytdlp";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".opus": "audio/opus",
  ".wav": "audio/wav",
  ".srt": "text/plain; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return new Response("Missing name", { status: 400 });

  // prevent path traversal: only allow a bare filename inside DOWNLOAD_DIR
  const safe = path.basename(name);
  const full = path.join(DOWNLOAD_DIR, safe);
  if (path.dirname(full) !== DOWNLOAD_DIR) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const s = await stat(full);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    const ext = path.extname(safe).toLowerCase();
    const nodeStream = createReadStream(full);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new Response(webStream, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Length": String(s.size),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          safe
        )}`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
