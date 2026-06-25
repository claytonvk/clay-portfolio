// Keyless site preview thumbnails via WordPress mShots (free, no API key,
// no signup, no watermark). A brand-new URL shows a gray placeholder for a
// few seconds while the shot is generated, then it's cached server-side.
// Override the provider base with NEXT_PUBLIC_SCREENSHOT_BASE if desired.
export function screenshotUrl(
  siteUrl: string | null,
  width = 640
): string | null {
  if (!siteUrl) return null;
  const clean = siteUrl.replace(/\/+$/, "");
  const base = process.env.NEXT_PUBLIC_SCREENSHOT_BASE;
  if (base) return `${base}/${clean}`;
  const height = Math.round((width * 450) / 640);
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(
    clean
  )}?w=${width}&h=${height}`;
}
