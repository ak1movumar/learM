import test from 'node:test';
import assert from 'node:assert/strict';
import {
  availableLanguages,
  canContinue,
  firstBeginnerLesson,
  initialDraft,
  parseDraft,
} from '../src/features/onboarding/model';
import { safeAuthRedirect } from '../src/features/auth/redirect';

test('onboarding offers only active languages with real courses', () => {
  assert.deepEqual(
    availableLanguages(
      [
        { id: 1, is_active: true },
        { id: 2, is_active: false },
        { id: 3, is_active: true },
      ],
      [{ language_id: 1 }, { language_id: 2 }],
    ),
    [{ id: 1, is_active: true }],
  );
});
test('onboarding restores valid drafts but rejects corrupt and out-of-range data', () => {
  assert.deepEqual(parseDraft('broken'), initialDraft);
  assert.deepEqual(
    parseDraft(JSON.stringify({ ...initialDraft, step: 4 })),
    initialDraft,
  );
  const draft = {
    ...initialDraft,
    step: 2,
    language: 1,
    experience: 'new' as const,
    purpose: 'travel' as const,
    minutes: 15 as const,
  };
  assert.deepEqual(parseDraft(JSON.stringify(draft)), draft);
  assert.equal(canContinue(draft, [1]), true);
  assert.equal(canContinue(draft, [2]), false);
  assert.equal(canContinue({ ...draft, purpose: null }, [1]), false);
  assert.equal(
    canContinue({ ...draft, step: 1, experience: null }, [1]),
    false,
  );
});
test('starting basics respects server locks and picks the first available A1 lesson', () => {
  const course = {
    level: 'A1',
    order: 1,
    is_unlocked: false,
    lessons: [
      { id: 2, order: 2, is_locked: false },
      { id: 1, order: 1, is_locked: false },
    ],
  };
  assert.equal(firstBeginnerLesson([course]), undefined);
  assert.equal(firstBeginnerLesson([{ ...course, is_unlocked: true }]), 1);
  assert.equal(
    firstBeginnerLesson([{ ...course, is_unlocked: true, level: 'A2' }]),
    undefined,
  );
  assert.equal(
    firstBeginnerLesson([
      {
        ...course,
        is_unlocked: true,
        lessons: [{ id: 1, order: 1, is_locked: true }],
      },
    ]),
    undefined,
  );
});
test('auth can return to onboarding and test catalog without accepting external destinations', () => {
  assert.equal(safeAuthRedirect('/onboarding'), '/onboarding');
  assert.equal(safeAuthRedirect('/level-tests'), '/level-tests');
  assert.equal(safeAuthRedirect('//evil.example/onboarding'), '/dashboard');
});
