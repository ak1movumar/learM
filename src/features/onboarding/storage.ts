import { env } from '@/lib/env';
import { parseDraft, initialDraft, type OnboardingDraft } from './model';
const memory = new Map<string, string>();
function key(user: string) {
  return 'learm:onboarding:' + env.NEXT_PUBLIC_API_URL + ':' + user;
}
export function readOnboarding(user: string) {
  const id = key(user);
  try {
    return parseDraft(localStorage.getItem(id) ?? memory.get(id) ?? null);
  } catch {
    return parseDraft(memory.get(id) ?? null);
  }
}
export function saveOnboarding(user: string, draft: OnboardingDraft) {
  const id = key(user),
    value = JSON.stringify(draft);
  memory.set(id, value);
  try {
    localStorage.setItem(id, value);
  } catch {
    /* Keep the current session usable when storage is unavailable. */
  }
}
export function beginOnboarding(user: string) {
  saveOnboarding(user, { ...initialDraft });
}
export function needsOnboarding(user: string) {
  const id = key(user);
  try {
    return (
      !!(localStorage.getItem(id) ?? memory.get(id)) &&
      !readOnboarding(user).completed
    );
  } catch {
    return memory.has(id) && !readOnboarding(user).completed;
  }
}
