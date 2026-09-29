import { z } from 'zod';
import { api } from '@/services/api/client';
import { rowSchema, type Row } from './model';
import { sessionStore } from '@/features/auth/session';
import { getApiFailure } from '@/services/api/errors';
import { knownLanguageIds, rememberLanguage } from './language-index';
export const resources = {
  languages: 'LanguageCreate',
  courses: 'CourseCreate',
  lessons: 'LessonCreate',
  exercises: 'ExerciseCreate',
  achievements: 'AchievementCreate',
  challenges: 'ChallengeCreate',
  'level-tests': 'LevelTestCreate',
  'test-questions': 'LevelTestQuestionCreate',
  users: null,
} as const;
export type Resource = keyof typeof resources;
export const resourcePath = (resource: Resource, parentTest?: string) =>
  resource === 'test-questions'
    ? '/level-tests/' + encodeURIComponent(parentTest ?? '') + '/questions'
    : '/' + resource + (resource === 'users' ? '/' : '');
export const resourceItemPath = (resource: Resource, id: number | string) =>
  (resource === 'test-questions'
    ? '/level-tests/questions/'
    : '/' + resource + '/') + encodeURIComponent(id);
export async function getResourceRows(
  resource: Resource,
  signal?: AbortSignal,
  parentTest?: string,
) {
  const rows = z
    .array(rowSchema)
    .parse(
      (await api.get<unknown>(resourcePath(resource, parentTest), { signal }))
        .data,
    );
  if (resource !== 'languages') return rows;
  // The public collection excludes inactive languages. Resolve only IDs
  // referenced by actual courses; never enumerate guessed database IDs.
  const courses = z
    .array(rowSchema)
    .parse((await api.get('/courses', { signal })).data);
  rows.forEach((row) => rememberLanguage(row.id));
  const ids = [
    ...new Set([
      ...courses.map((course) => course.language_id),
      ...knownLanguageIds(),
    ]),
  ]
    .filter(
      (id): id is number =>
        typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
    )
    .filter((id) => !rows.some((row) => row.id === id));
  for (const id of ids) {
    try {
      const row = rowSchema.parse(
        (await api.get('/languages/' + id, { signal })).data,
      );
      if (row.id !== id) throw new Error('Language identity mismatch');
      rememberLanguage(row.id);
      rows.push(row);
    } catch (error) {
      if (getApiFailure(error).status !== 404) throw error;
    }
  }
  return rows;
}

export async function removeResource(resource: Resource, id: number | string) {
  if (resource === 'users')
    await api.patch(resourceItemPath(resource, id) + '/active', {
      is_active: false,
    });
  else await api.delete(resourceItemPath(resource, id));
}

export async function saveResource(
  resource: Resource,
  row: Row | 'new',
  payload: Record<string, unknown>,
  parentTest?: string,
) {
  const generation = sessionStore.getSnapshot().generation;
  if (resource === 'users') {
    if (row === 'new') throw new Error('User creation is not supported here');
    if (payload.role !== row.role)
      await api.patch(resourceItemPath(resource, row.id) + '/role', {
        role: payload.role,
      });
    if (generation !== sessionStore.getSnapshot().generation)
      throw new Error('Session changed');
    if (payload.is_active !== row.is_active)
      await api.patch(resourceItemPath(resource, row.id) + '/active', {
        is_active: payload.is_active,
      });
  } else if (row === 'new') {
    const response = await api.post(
      resourcePath(resource, parentTest),
      payload,
    );
    if (resource === 'languages') rememberLanguage(response.data?.id);
  } else {
    await api.put(resourceItemPath(resource, row.id), payload);
    if (resource === 'languages') rememberLanguage(row.id);
  }
  return generation;
}
