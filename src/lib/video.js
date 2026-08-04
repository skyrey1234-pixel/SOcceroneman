const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const SUPPORTED_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);
export const MAX_MATCH_VIDEO_BYTES = 10 * 1024 * 1024 * 1024;

export function youtubeId(input = "") {
  const value = input.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(host)) return null;

    if (host.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0]?.match(/^[A-Za-z0-9_-]{11}$/)?.[0] || null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const candidate = url.searchParams.get("v") ||
      (pathParts[0] === "embed" || pathParts[0] === "shorts" ? pathParts[1] : null);
    return candidate?.match(/^[A-Za-z0-9_-]{11}$/)?.[0] || null;
  } catch {
    return null;
  }
}

export function youtubeThumb(url) {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function validateMatchVideoFile(file) {
  if (!file) return "Choose a match video before saving.";

  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (!SUPPORTED_VIDEO_EXTENSIONS.has(extension)) {
    return "Use an MP4, MOV, or WebM match video.";
  }

  if (file.size > MAX_MATCH_VIDEO_BYTES) {
    return "This file is larger than 10 GB. Trim or compress the footage, or add the match as a YouTube link instead.";
  }

  return null;
}

export async function verifyYoutubeVideo(url) {
  const id = youtubeId(url);
  if (!id) {
    return {
      ok: false,
      message: "Paste a valid YouTube watch, short, embed, or youtu.be link.",
    };
  }

  try {
    const canonicalUrl = `https://www.youtube.com/watch?v=${id}`;
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`
    );

    if (!response.ok) throw new Error(`YouTube returned ${response.status}`);
    const metadata = await response.json();
    return { ok: true, id, title: metadata.title || "YouTube video" };
  } catch {
    return {
      ok: false,
      message:
        "We could not confirm that this video is playable. Use a public or unlisted YouTube video with embedding enabled, and make sure it is not region- or age-restricted.",
    };
  }
}