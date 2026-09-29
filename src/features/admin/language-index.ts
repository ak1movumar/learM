import { env } from '@/lib/env';
const key = 'learm:admin:language-ids:' + env.NEXT_PUBLIC_API_URL;
const known = new Set<number>();
export function knownLanguageIds() {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (Array.isArray(ids))
      for (const id of ids) {
        if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
          known.add(id);
      }
  } catch {
    /* Storage is optional; server details remain authoritative. */
  }
  return [...known];
}
export function rememberLanguage(id: unknown) {
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) return;
  knownLanguageIds();
  known.add(id);
  try {
    localStorage.setItem(key, JSON.stringify([...known]));
  } catch {
    /* Session fallback. */
  }
}
