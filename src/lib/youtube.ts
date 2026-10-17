const PATTERNS = [
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
];

/** The 11-character video id from a YouTube URL, or null if it isn't one. */
export function youtubeId(url: string): string | null {
  for (const pattern of PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function youtubeEmbedUrl(id: string, start?: number): string {
  const params = new URLSearchParams({ autoplay: '1', rel: '0' });
  if (start) params.set('start', String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
