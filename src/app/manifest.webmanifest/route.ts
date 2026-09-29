import type { MetadataRoute } from 'next';

export function GET(request: Request) {
  const dark = new URL(request.url).searchParams.get('theme') === 'dark';
  const manifest: MetadataRoute.Manifest = {
    id: '/',
    name: 'LearM',
    short_name: 'LearM',
    description: 'Learn languages with LearM and Motion Community',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: dark ? '#0c1020' : '#ffffff',
    theme_color: dark ? '#0c1020' : '#ffffff',
    icons: [
      {
        src: '/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache',
    },
  });
}
