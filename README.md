<div align="center">

# 🎬 YouTube Downloader

**A clean, local web app to download videos, extract audio, and pull transcripts — powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp).**

Paste a link, pick what you want, and it’s saved to your machine. No ads, no accounts, no tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-black)](https://ui.shadcn.com)

</div>

<!--
  📸 Add a screenshot here to make the repo shine:
  1. Run the app, take a screenshot of the home screen.
  2. Save it as docs/screenshot.png
  3. Uncomment the line below.

<div align="center">
  <img src="docs/screenshot.png" alt="YouTube Downloader screenshot" width="720" />
</div>
-->

---

## ✨ Features

- **🎞️ Video** — pick a quality (4K → 144p) and download a merged MP4. Prefers H.264/AAC for maximum compatibility, with a live progress bar (speed + ETA).
- **📝 Transcript** — grab captions in any available language (manual **or** auto-generated, ~200 languages) as **plain text**, **timestamped text**, **`.srt`**, or **`.vtt`**. Preview, copy, or download.
- **🎵 Audio** — extract audio to **MP3 / M4A / Opus / WAV** at your chosen bitrate.
- **🌙 Modern UI** — dark, responsive interface built with shadcn/ui. Everything runs **locally on your machine** — your data never leaves your computer.

---

## 🚀 Quick start

### 1. Install the prerequisites

You need **[Node.js](https://nodejs.org) 18+** and two command-line tools, `yt-dlp` and `ffmpeg`:

```bash
# macOS (Homebrew)
brew install yt-dlp ffmpeg

# Windows (winget)
winget install yt-dlp.yt-dlp ffmpeg

# Linux (Debian/Ubuntu)
sudo apt install ffmpeg && sudo pipx install yt-dlp
```

> Verify they’re installed: `yt-dlp --version` and `ffmpeg -version`.

### 2. Clone and run

```bash
git clone https://github.com/ErfanMowlavian/Youtube_Downloader.git
cd Youtube_Downloader
npm install
npm run dev
```

### 3. Open the app

Visit **[http://localhost:3000](http://localhost:3000)**, paste a video URL, hit **Fetch**, and choose **Video**, **Transcript**, or **Audio**. 🎉

Downloaded files are saved to the project’s **`downloads/`** folder (and can also be saved through your browser).

---

## 🧭 How to use

| Step | What to do |
|------|------------|
| 1 | Paste any YouTube (or other yt-dlp–supported) URL and click **Fetch**. |
| 2 | Review the preview card — title, channel, views, duration. |
| 3 | Open the **Video**, **Transcript**, or **Audio** tab. |
| 4 | Choose your options (quality / language / format) and click download. |
| 5 | Grab the file from the in-app link or the `downloads/` folder. |

---

## 🛠️ Tech stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Engine | [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [ffmpeg](https://ffmpeg.org) (spawned as subprocesses) |

---

## 📡 API overview

The UI is backed by a few simple route handlers — handy if you want to script against them:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/info` | `POST` | Returns normalized metadata, selectable qualities, and subtitle tracks. |
| `/api/download` | `POST` | Spawns yt-dlp and **streams NDJSON progress** (`progress` · `status` · `done` · `error`). |
| `/api/transcript` | `POST` | Fetches a subtitle track and converts it to txt / srt / vtt. |
| `/api/file` | `GET` | Streams a finished file from `downloads/` (with a path-traversal guard). |

---

## 📁 Project structure

```
src/
├─ app/
│  ├─ api/            # info · download · transcript · file route handlers
│  ├─ page.tsx        # home page
│  └─ layout.tsx      # root layout + theme
├─ components/
│  ├─ panels/         # video · transcript · audio panels
│  ├─ ui/             # shadcn/ui primitives
│  └─ downloader.tsx  # main orchestrator
├─ hooks/             # useDownload (streaming progress)
└─ lib/               # yt-dlp wrapper, VTT parsing, formatting
```

---

## 🩺 Troubleshooting

<details>
<summary><strong>“yt-dlp not found” or downloads fail instantly</strong></summary>

Make sure `yt-dlp` and `ffmpeg` are installed and on your `PATH`
(`yt-dlp --version`). On macOS the app also checks common Homebrew paths
automatically.
</details>

<details>
<summary><strong>A specific video won’t download</strong></summary>

YouTube changes things often. Update yt-dlp to the latest version:
`brew upgrade yt-dlp` (or `yt-dlp -U`).
</details>

<details>
<summary><strong>Port 3000 is already in use</strong></summary>

Next.js will fall back to the next free port (e.g. 3001) — check the terminal
output for the exact URL, or free port 3000.
</details>

---

## 🤝 Contributing

Contributions are welcome! Open an issue to discuss a change, or send a pull request.

```bash
npm run lint    # check code style
npm run build   # verify the production build
```

---

## ⚠️ Disclaimer

This tool is intended for **personal use** — for example, downloading your own
content or videos you have permission to save. Please respect content creators’
rights, copyright law, and [YouTube’s Terms of Service](https://www.youtube.com/t/terms).

---

## 📄 License

[MIT](LICENSE) © Erfan Mowlavian
