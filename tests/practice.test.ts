import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAdvancePractice,
  needsPracticeReview,
} from '../src/features/lessons/practice-state';
import { practiceFeedback } from '../src/features/lessons/practice-feedback';
import { beginnerCourse } from '../src/features/admin/course-import/beginner-course';
import { elementaryCourse } from '../src/features/admin/course-import/elementary-course';

test('practice offers a retry after one error and allows continuing after two or reveal', () => {
  assert.equal(canAdvancePractice(false, false, 0), false);
  assert.equal(canAdvancePractice(false, false, 1), false);
  assert.equal(canAdvancePractice(false, false, 2), true);
  assert.equal(canAdvancePractice(false, true, 0), true);
  assert.equal(canAdvancePractice(true, false, 0), true);
});
test('missed exercises return once, including mistakes corrected on a second attempt', () => {
  const missed = new Set([1, 2]);
  const reviewed = new Set<number>();
  assert.equal(needsPracticeReview(1, missed, reviewed), true);
  reviewed.add(1);
  assert.equal(needsPracticeReview(1, missed, reviewed), false);
  assert.equal(needsPracticeReview(2, missed, reviewed), true);
  assert.equal(needsPracticeReview(3, missed, reviewed), false);
});
test('A1 and A2 explanations match authored questions exactly, never stale IDs', () => {
  for (const course of [beginnerCourse, elementaryCourse]) {
    for (const lesson of course.lessons) {
      for (const task of lesson.exercises) {
        const exercise = { ...task, id: 123, lesson_id: 1 };
        assert.equal(practiceFeedback(exercise)?.answer, task.correct_answer);
        assert.ok(practiceFeedback(exercise)?.explanation);
        assert.equal(
          practiceFeedback({
            ...exercise,
            question: task.question + ' changed',
          }),
          null,
        );
      }
    }
  }
});
