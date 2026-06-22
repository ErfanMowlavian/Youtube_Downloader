"use client";

import { useCallback, useRef, useState } from "react";
import type { ProgressEvent } from "@/lib/types";

export interface DownloadState {
  status: "idle" | "running" | "done" | "error";
  percent: number;
  speed: string;
  eta: string;
  message: string;
  file: string | null;
  downloadUrl?: string;
  error?: string;
}

const initial: DownloadState = {
  status: "idle",
  percent: 0,
  speed: "",
  eta: "",
  message: "",
  file: null,
};

export function useDownload() {
  const [state, setState] = useState<DownloadState>(initial);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState(initial);
  }, []);

  const reset = useCallback(() => setState(initial), []);

  const start = useCallback(async (body: Record<string, unknown>) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ ...initial, status: "running", message: "Starting…" });

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as ProgressEvent;
          setState((s) => applyEvent(s, evt));
        }
      }
    } catch (e) {
      if (ac.signal.aborted) return;
      setState((s) => ({
        ...s,
        status: "error",
        error: e instanceof Error ? e.message : "Download failed",
      }));
    }
  }, []);

  return { state, start, cancel, reset };
}

function applyEvent(s: DownloadState, evt: ProgressEvent): DownloadState {
  switch (evt.type) {
    case "progress":
      return {
        ...s,
        status: "running",
        percent: evt.percent,
        speed: evt.speed,
        eta: evt.eta,
        message: "",
      };
    case "status":
      return { ...s, status: "running", message: evt.message };
    case "done":
      return {
        ...s,
        status: "done",
        percent: 100,
        message: "",
        file: evt.file,
        downloadUrl: evt.downloadUrl,
      };
    case "error":
      return { ...s, status: "error", error: evt.message };
    default:
      return s;
  }
}
