import { z } from 'zod';

export const onboardingSchema = z.object({
  step: z.number().int().min(0).max(3),
  language: z.number().int().positive().nullable(),
  experience: z.enum(['new', 'some', 'conversation', 'unsure']).nullable(),
  purpose: z.enum(['travel', 'work', 'study', 'personal']).nullable(),
  minutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  completed: z.boolean(),
});
export type OnboardingDraft = z.infer<typeof onboardingSchema>;
export const initialDraft: OnboardingDraft = {
  step: 0,
  language: null,
  experience: null,
  purpose: null,
  minutes: 10,
  completed: false,
};
export function parseDraft(value: string | null): OnboardingDraft {
  try {
    return onboardingSchema.parse(JSON.parse(value ?? 'null'));
  } catch {
    return { ...initialDraft };
  }
}
export function availableLanguages<
  T extends { id: number; is_active: boolean },
>(languages: T[], courses: { language_id: number }[]) {
  return languages.filter(
    (language) =>
      language.is_active &&
      courses.some((course) => course.language_id === language.id),
  );
}
export function canContinue(draft: OnboardingDraft, ids: number[]) {
  if (!draft.language || !ids.includes(draft.language)) return false;
  if (draft.step >= 1 && !draft.experience) return false;
  if (draft.step >= 2 && !draft.purpose) return false;
  return true;
}
export function firstBeginnerLesson(
  courses: {
    level: string;
    order: number;
    is_unlocked: boolean;
    lessons: { id: number; order: number; is_locked: boolean }[];
  }[],
) {
  return [...courses]
    .filter((c) => c.level === 'A1' && c.is_unlocked)
    .sort((a, b) => a.order - b.order)
    .flatMap((c) => [...c.lessons].sort((a, b) => a.order - b.order))
    .find((l) => !l.is_locked)?.id;
}
