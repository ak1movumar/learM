import test from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, type AxiosAdapter } from 'axios';
import { api, publicApi } from '../src/services/api/client';
import {
  getResourceRows,
  removeResource,
  saveResource,
  resourcePath,
  resourceItemPath,
  resources,
  type Resource,
} from '../src/features/admin/resources';
import { getCourses } from '../src/features/courses/catalog-api';
import { adminErrorMessage } from '../src/features/admin/errors';

test('admin reads inactive languages through actual course references while client hides their courses', async () => {
  const original = api.defaults.adapter,
    originalPublic = publicApi.defaults.adapter;
  const adapter: AxiosAdapter = async (config) => {
    let data: unknown;
    if (config.url === '/languages') data = [];
    else if (config.url === '/courses')
      data = [
        {
          id: 1,
          language_id: 1,
          title: 'A1',
          description: '',
          level: 'A1',
          order: 1,
        },
      ];
    else if (config.url === '/languages/1')
      data = { id: 1, name: 'English', code: 'en', is_active: false };
    else throw new Error('Unexpected URL: ' + config.url);
    return { config, data, status: 200, statusText: 'OK', headers: {} };
  };
  api.defaults.adapter = publicApi.defaults.adapter = adapter;
  try {
    assert.deepEqual(
      (await getResourceRows('languages')).map((row) => [
        row.id,
        row.is_active,
      ]),
      [[1, false]],
    );
    assert.deepEqual(await getCourses(), []);
  } finally {
    api.defaults.adapter = original;
    publicApi.defaults.adapter = originalPublic;
  }
});

test('all admin content resources use documented list, create, update and delete routes', async () => {
  const original = api.defaults.adapter;
  const calls: { method?: string; url?: string; data: unknown }[] = [];
  api.defaults.adapter = async (config) => {
    calls.push({
      method: config.method,
      url: config.url,
      data: config.data ? JSON.parse(config.data) : undefined,
    });
    return {
      config,
      data: { id: 7 },
      status: 200,
      statusText: 'OK',
      headers: {},
    };
  };
  try {
    for (const resource of Object.keys(resources) as Resource[]) {
      if (resource === 'users') continue;
      const payload = { title: 'test' };
      await saveResource(resource, 'new', payload, 'test-id');
      assert.deepEqual(calls.at(-1), {
        method: 'post',
        url: resourcePath(resource, 'test-id'),
        data: payload,
      });
      await saveResource(resource, { id: 7 }, payload, 'test-id');
      assert.deepEqual(calls.at(-1), {
        method: 'put',
        url: resourceItemPath(resource, 7),
        data: payload,
      });
      await removeResource(resource, 7);
      assert.deepEqual(calls.at(-1), {
        method: 'delete',
        url: resourceItemPath(resource, 7),
        data: undefined,
      });
    }
    await removeResource('users', 'user-id');
    assert.deepEqual(calls.at(-1), {
      method: 'patch',
      url: '/users/user-id/active',
      data: { is_active: false },
    });
    await saveResource(
      'users',
      { id: 'user-id', role: 'user', is_active: false },
      { role: 'admin', is_active: true },
    );
    assert.deepEqual(calls.slice(-2), [
      { method: 'patch', url: '/users/user-id/role', data: { role: 'admin' } },
      {
        method: 'patch',
        url: '/users/user-id/active',
        data: { is_active: true },
      },
    ]);
  } finally {
    api.defaults.adapter = original;
  }
});

test('admin errors distinguish access, conflict, validation and server failure without exposing database details', () => {
  for (const status of [401, 403, 404, 405, 409, 422, 429, 500]) {
    const error = new AxiosError('failure', undefined, undefined, undefined, {
      status,
      data: { detail: 'SECRET SQL TRACE' },
      statusText: 'Error',
      headers: {},
      config: {} as never,
    });
    for (const locale of ['ru', 'en', 'ky'] as const) {
      assert.ok(adminErrorMessage(error, locale).includes('HTTP ' + status));
      assert.ok(!adminErrorMessage(error, locale).includes('SECRET'));
    }
  }
});
