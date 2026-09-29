import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { GET } from '../src/app/manifest.webmanifest/route';

test('PWA keeps a stable identity and supplies valid icons in both themes', async () => {
  for (const theme of ['light', 'dark']) {
    const response = GET(
      new Request(`https://learm.test/manifest.webmanifest?theme=${theme}`),
    );
    const manifest = await response.json();
    assert.equal(manifest.id, '/');
    assert.equal(manifest.display, 'standalone');
    assert.equal(
      manifest.background_color,
      theme === 'dark' ? '#0c1020' : '#ffffff',
    );
    for (const icon of manifest.icons)
      assert.ok(existsSync(`public${icon.src}`));
  }
});

test('service worker leaves APIs and mutations untouched and only uses offline fallback for failed navigation', async () => {
  type FetchEvent = {
    request: { url: string; method: string; mode: string };
    respondWith: (response: Promise<Response>) => void;
  };
  const handlers: Record<string, (event: FetchEvent) => void> = {};
  let networkCalls = 0;
  let offline = false;
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: {
      location: { origin: 'https://learm.test' },
      addEventListener: (name: string, handler: (typeof handlers)[string]) => {
        handlers[name] = handler;
      },
    },
    URL,
    Response,
    fetch: async () => {
      networkCalls++;
      if (offline) throw new Error('offline');
      return new Response('live');
    },
    caches: {
      match: async (path: string) => {
        assert.equal(path, '/offline.html');
        return new Response('offline');
      },
    },
  });
  let result: Promise<Response> | undefined;
  const send = (url: string, method: string, mode: string) =>
    handlers.fetch!({
      request: { url, method, mode },
      respondWith: (response) => {
        result = response;
      },
    });
  send('https://learm.test/api/users/me', 'GET', 'cors');
  send('https://learm.test/lesson', 'POST', 'navigate');
  send('https://api.test/lessons', 'GET', 'navigate');
  assert.equal(networkCalls, 0);
  assert.equal(result, undefined);
  send('https://learm.test/lessons/1', 'GET', 'navigate');
  assert.equal(await (await result!).text(), 'live');
  offline = true;
  send('https://learm.test/lessons/1', 'GET', 'navigate');
  assert.equal(await (await result!).text(), 'offline');
});
