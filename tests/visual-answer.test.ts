import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExerciseSubmission,
  canSubmitAnswer,
  exerciseInput,
  type Task,
} from '../src/features/lessons/exercise-adapter';
import { buildTestSubmission } from '../src/features/placement/contracts';
const choice: Task = { type: 'choice', options: { A: 'Яблоко', B: 'Груша' } };
const match: Task = {
  type: 'match',
  options: {
    left: { apple: 'apple', pear: 'pear' },
    right: { a: 'Груша', b: 'Яблоко' },
  },
};
test('choice submits selected key, never its display text or index', () => {
  assert.equal(exerciseInput(choice)?.kind, 'choice');
  assert.deepEqual(buildExerciseSubmission(choice, 'A'), { answer: 'A' });
  for (const answer of ['', 'Яблоко', 0, 'C', { A: true }])
    assert.equal(canSubmitAnswer(choice, answer), false);
});
test('match accepts complete one-to-one pairs and preserves IDs as a JSON object', () => {
  const answer = { apple: 'b', pear: 'a' };
  assert.deepEqual(buildExerciseSubmission(match, answer), { answer });
  for (const incomplete of [
    {},
    { apple: 'b' },
    { apple: 'b', pear: 'b' },
    { apple: 'b', pear: 'other' },
    { wrong: 'b', pear: 'a' },
    JSON.stringify(answer),
  ])
    assert.equal(canSubmitAnswer(match, incomplete), false);
  // Incorrect but complete pairs must reach server grading, not be blocked locally.
  assert.equal(canSubmitAnswer(match, { apple: 'a', pear: 'b' }), true);
});
test('malformed visual options fail closed rather than showing broken controls', () => {
  for (const task of [
    { type: 'choice', options: { A: { text: 'nested' } } },
    { type: 'match', options: { left: { a: 'A' }, right: {} } },
  ] as Task[])
    assert.equal(exerciseInput(task), null);
});
test('level test submission preserves choice strings and structured match answers', () => {
  const attempt = {
    attempt_id: 'id',
    test_id: 'test',
    is_placement: true,
    target_level: null,
    questions: [
      {
        ...choice,
        id: 1,
        test_id: 'test',
        question: '?',
        level: 'A1' as const,
        order: 1,
      },
      {
        ...match,
        id: 2,
        test_id: 'test',
        question: '?',
        level: 'A1' as const,
        order: 2,
      },
    ],
  };
  assert.deepEqual(
    buildTestSubmission(attempt, { 1: 'A', 2: { apple: 'b', pear: 'a' } }),
    {
      answers: [
        { question_id: 1, answer: 'A' },
        { question_id: 2, answer: { apple: 'b', pear: 'a' } },
      ],
    },
  );
});
