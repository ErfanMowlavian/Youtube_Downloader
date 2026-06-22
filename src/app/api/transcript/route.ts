import { NextRequest, NextResponse } from "next/server";
import { mkdtemp, readdir, readFile, writeFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { DOWNLOAD_DIR, runJson, YT_DLP } from "@/lib/ytdlp";
import { spawn } from "node:child_process";
import {
  parseVtt,
  toPlainText,
  toTimestampedText,
  toSrt,
} from "@/lib/subs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Format = "txt" | "txt-timestamped" | "srt" | "vtt";

interface Body {
  url: string;
  lang: string;
  auto: boolean;
  format: Format;
}

function runRaw(args: string[]): Promise<{ code: number; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(YT_DLP, args);
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => resolve({ code: 1, err: e.message }));
    child.on("close", (code) => resolve({ code: code ?? 1, err }));
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const { url, lang, auto, format } = body;
  if (!url || !lang) {
    return NextResponse.json({ error: "Missing url or language" }, { status: 400 });
  }

  const tmp = await mkdtemp(path.join(os.tmpdir(), "ytsub-"));
  try {
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--skip-download",
      auto ? "--write-auto-subs" : "--write-subs",
      "--sub-langs",
      lang,
      "--sub-format",
      "vtt",
      "-o",
      path.join(tmp, "%(id)s.%(ext)s"),
      url,
    ];
    const { code, err } = await runRaw(args);

    const files = await readdir(tmp);
    const vttFile = files.find((f) => f.endsWith(".vtt"));
    if (!vttFile) {
      return NextResponse.json(
        {
          error:
            code !== 0
              ? err.split("\n").filter(Boolean).pop() || "Failed to fetch subtitles"
              : "No subtitles found for that language.",
        },
        { status: 404 }
      );
    }

    const vtt = await readFile(path.join(tmp, vttFile), "utf-8");
    const cues = parseVtt(vtt);

    let content: string;
    let ext: string;
    switch (format) {
      case "srt":
        content = toSrt(cues);
        ext = "srt";
        break;
      case "vtt":
        content = vtt;
        ext = "vtt";
        break;
      case "txt-timestamped":
        content = toTimestampedText(cues);
        ext = "txt";
        break;
      default:
        content = toPlainText(cues);
        ext = "txt";
    }

    // get a friendly title for the saved filename
    let title = vttFile.replace(/\.[^.]+\.vtt$/, "");
    try {
      const printed = await runJson([
        "--no-playlist",
        "--no-warnings",
        "--skip-download",
        "--print",
        "%(title).180B [%(id)s]",
        url,
      ]);
      if (printed.trim()) title = printed.trim();
    } catch {
      /* keep id-based title */
    }

    await mkdir(DOWNLOAD_DIR, { recursive: true });
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, "_");
    const fileName = `${safeTitle}.${lang}.${ext}`;
    await writeFile(path.join(DOWNLOAD_DIR, fileName), content, "utf-8");

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      content,
      preview: format === "txt" ? content : toPlainText(cues),
      file: fileName,
      downloadUrl: `/api/file?name=${encodeURIComponent(fileName)}`,
      cueCount: cues.length,
      wordCount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to extract transcript";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}
