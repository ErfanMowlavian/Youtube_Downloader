import { NextRequest, NextResponse } from "next/server";
import { getInfo } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid video URL." },
      { status: 400 }
    );
  }

  try {
    const info = await getInfo(url.trim());
    return NextResponse.json(info);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch video info";
    // surface a cleaner message for common failures
    const clean = msg.includes("Unsupported URL")
      ? "That URL isn't supported by yt-dlp."
      : msg.split("\n").pop() || msg;
    return NextResponse.json({ error: clean }, { status: 502 });
  }
}
