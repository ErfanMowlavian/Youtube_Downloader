import { Downloader } from "@/components/downloader";
import { Play } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex-1">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.62_0.235_26/0.18),transparent)]"
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Play className="size-7 fill-current" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            YouTube Downloader
          </h1>
          <p className="mt-2 max-w-md text-balance text-muted-foreground">
            Download videos, extract audio, or pull transcripts — powered by
            yt-dlp, running locally on your Mac.
          </p>
        </header>

        <Downloader />

        <footer className="mt-12 text-center text-xs text-muted-foreground/70">
          Files are saved to the project&apos;s{" "}
          <code className="rounded bg-muted px-1 py-0.5">downloads/</code> folder.
          For personal use — respect creators&apos; rights and YouTube&apos;s
          Terms of Service.
        </footer>
      </div>
    </main>
  );
}
