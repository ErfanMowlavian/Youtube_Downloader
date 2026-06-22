export interface Cue {
  start: string; // 00:00:01.000
  end: string;
  text: string;
}

const TIME_RE =
  /(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/;

/** Strip inline timing/formatting tags like <00:00:00.480><c> and </c>. */
function stripTags(s: string): string {
  return s
    .replace(/<\d{2}:\d{2}:\d{2}[.,]\d{3}>/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function parseVtt(vtt: string): Cue[] {
  const blocks = vtt.replace(/\r\n/g, "\n").split(/\n\n+/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeLine = lines.find((l) => TIME_RE.test(l));
    if (!timeLine) continue;
    const m = timeLine.match(TIME_RE)!;
    const idx = lines.indexOf(timeLine);
    const text = lines
      .slice(idx + 1)
      .map(stripTags)
      .filter(Boolean)
      .join("\n");
    if (text) cues.push({ start: m[1], end: m[2], text });
  }
  return cues;
}

/** Plain readable transcript — de-duplicates the rolling lines auto-captions emit. */
export function toPlainText(cues: Cue[]): string {
  const out: string[] = [];
  let last = "";
  for (const cue of cues) {
    for (const line of cue.text.split("\n")) {
      const t = line.trim();
      if (t && t !== last) {
        out.push(t);
        last = t;
      }
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/** Plain transcript with [hh:mm:ss] timestamps per cue. */
export function toTimestampedText(cues: Cue[]): string {
  const out: string[] = [];
  let last = "";
  for (const cue of cues) {
    const text = cue.text.replace(/\n/g, " ").trim();
    if (text && text !== last) {
      out.push(`[${cue.start.slice(0, 8)}] ${text}`);
      last = text;
    }
  }
  return out.join("\n");
}

export function toSrt(cues: Cue[]): string {
  // collapse rolling duplicates first
  const clean: Cue[] = [];
  let last = "";
  for (const cue of cues) {
    const text = cue.text.replace(/\n/g, " ").trim();
    if (text && text !== last) {
      clean.push({ ...cue, text });
      last = text;
    }
  }
  return clean
    .map((c, i) => {
      const start = c.start.replace(".", ",");
      const end = c.end.replace(".", ",");
      return `${i + 1}\n${start} --> ${end}\n${c.text}\n`;
    })
    .join("\n");
}
