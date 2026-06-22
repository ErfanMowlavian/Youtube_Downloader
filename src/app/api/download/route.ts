import { NextRequest } from "next/server";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DOWNLOAD_DIR, spawnYtDlp } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUT_TEMPLATE = "%(title).180B [%(id)s].%(ext)s";

interface Body {
  url: string;
  mode: "video" | "audio";
  selector?: string; // for video
  audioFormat?: "mp3" | "m4a" | "opus" | "wav"; // for audio
  audioQuality?: string; // "0" best .. or bitrate like "192"
}

function buildArgs(b: Body): string[] {
  const out = path.join(DOWNLOAD_DIR, OUT_TEMPLATE);
  const common = [
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "--progress-template",
    "download:PRG|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s",
    "--no-simulate",
    "--print",
    "after_move:FILE|%(filepath)s",
    "-o",
    out,
  ];

  if (b.mode === "audio") {
    return [
      ...common,
      "-f",
      "bestaudio/best",
      "-x",
      "--audio-format",
      b.audioFormat ?? "mp3",
      "--audio-quality",
      b.audioQuality ?? "0",
      "--embed-metadata",
      "--embed-thumbnail",
      b.url,
    ];
  }

  // video
  return [
    ...common,
    "-f",
    b.selector ?? "bestvideo+bestaudio/best",
    "--merge-output-format",
    "mp4",
    "--embed-metadata",
    b.url,
  ];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  if (!body?.url || !/^https?:\/\//i.test(body.url)) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
    });
  }
  await mkdir(DOWNLOAD_DIR, { recursive: true });

  const args = buildArgs(body);
  const child = spawnYtDlp(args);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (obj: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      let buffer = "";
      let stderrTail = "";
      let finalFile: string | null = null;

      const handleLine = (line: string) => {
        const l = line.trim();
        if (!l) return;
        if (l.startsWith("PRG|")) {
          const [, percent, speed, eta] = l.split("|");
          send({
            type: "progress",
            percent: parsePercent(percent),
            speed: (speed ?? "").trim(),
            eta: (eta ?? "").trim(),
          });
        } else if (l.startsWith("FILE|")) {
          finalFile = l.slice(5).trim();
        } else if (/\[Merger\]|Merging formats/i.test(l)) {
          send({ type: "status", message: "Merging video + audio…" });
        } else if (/\[ExtractAudio\]|Destination.*\.(mp3|m4a|opus|wav)/i.test(l)) {
          send({ type: "status", message: "Extracting audio…" });
        } else if (/\[EmbedThumbnail\]|\[Metadata\]|\[ThumbnailsConvertor\]/i.test(l)) {
          send({ type: "status", message: "Finalizing…" });
        }
      };

      const onData = (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) handleLine(line);
      };

      child.stdout.on("data", onData);
      child.stderr.on("data", (c: Buffer) => {
        stderrTail = (stderrTail + c.toString()).slice(-2000);
        onData(c);
      });

      child.on("error", (e) => {
        send({ type: "error", message: e.message });
        closed = true;
        controller.close();
      });

      child.on("close", (code) => {
        if (buffer) handleLine(buffer);
        if (code === 0 && finalFile) {
          const name = path.basename(finalFile);
          send({
            type: "done",
            file: name,
            downloadUrl: `/api/file?name=${encodeURIComponent(name)}`,
          });
        } else if (code === 0) {
          send({ type: "done", file: null });
        } else {
          send({
            type: "error",
            message:
              stderrTail.split("\n").filter(Boolean).pop() ||
              `yt-dlp exited with code ${code}`,
          });
        }
        closed = true;
        controller.close();
      });

      // abort the child if the client disconnects
      req.signal.addEventListener("abort", () => {
        child.kill("SIGKILL");
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function parsePercent(s: string): number {
  const m = (s ?? "").match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : 0;
}
