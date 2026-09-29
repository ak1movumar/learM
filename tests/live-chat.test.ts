import test from 'node:test';
import assert from 'node:assert/strict';
import { messagesOptions, chatsOptions } from '../src/features/chats/queries';
import { languagePayload } from '../src/features/admin/language-payload';
import { deleteAccount } from '../src/features/account/api';
import { api } from '../src/services/api/client';

test('chat overrides global minute-long freshness and refreshes after tab return/reconnect', () => {
  for (const options of [
    messagesOptions('chat', true),
    messagesOptions('chat'),
    chatsOptions(),
  ]) {
    assert.equal(options.staleTime, 0);
    assert.equal(options.refetchOnMount, 'always');
    assert.equal(options.refetchOnWindowFocus, 'always');
    assert.equal(options.refetchOnReconnect, 'always');
    assert.equal(options.refetchIntervalInBackground, false);
  }
  assert.equal(messagesOptions('chat', true).refetchInterval, 2000);
  assert.equal(messagesOptions('chat').refetchInterval, 5000);
});
test('language input preserves Cyrillic names and normalizes codes without silently dropping fields', () => {
  assert.deepEqual(
    languagePayload({ code: ' RU ', name: ' Русский ', is_active: false }),
    { code: 'ru', name: 'Русский', is_active: false },
  );
  assert.deepEqual(
    languagePayload({ code: 'ky', name: 'Кыргызча', is_active: true }),
    { code: 'ky', name: 'Кыргызча', is_active: true },
  );
  assert.throws(() => languagePayload({ code: ' ', name: 'Русский' }));
  assert.throws(() => languagePayload({ code: 'ru', name: ' ' }));
});
test('self deletion sends documented DELETE and propagates failure rather than claiming success', async () => {
  const original = api.defaults.adapter;
  try {
    api.defaults.adapter = async (config) => {
      assert.equal(config.method, 'delete');
      assert.equal(config.url, '/users/me');
      throw new Error('Server failure');
    };
    await assert.rejects(deleteAccount(), /Server failure/);
    api.defaults.adapter = async (config) => ({
      config,
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
    });
    await deleteAccount();
  } finally {
    api.defaults.adapter = original;
  }
});
