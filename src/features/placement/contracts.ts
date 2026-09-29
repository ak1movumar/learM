import { z } from 'zod';
import type { components } from '@/types/api.generated';
import { courseSchema } from '@/features/courses/catalog-api';
import { lessonSchema, exerciseSchema } from '@/features/lessons/contracts';
import { canSubmitAnswer } from '@/features/lessons/exercise-adapter';

export const levelSchema = courseSchema.shape.level;
export const learningPathSchema = z.object({
  language_id: z.number().int(),
  level: levelSchema.nullable(),
  placement_completed: z.boolean(),
  courses: z.array(
    courseSchema.extend({
      is_unlocked: z.boolean(),
      lessons: z.array(lessonSchema),
    }),
  ),
}) satisfies z.ZodType<components['schemas']['LearningPathResponse']>;
export const testQuestionSchema = exerciseSchema
  .omit({ lesson_id: true })
  .extend({
    test_id: z.uuid(),
    level: levelSchema,
    order: z.number().int(),
  }) satisfies z.ZodType<components['schemas']['LevelTestQuestionResponse']>;
export const testStartSchema = z.object({
  attempt_id: z.uuid(),
  test_id: z.uuid(),
  is_placement: z.boolean(),
  target_level: levelSchema.nullable(),
  questions: z.array(testQuestionSchema),
}) satisfies z.ZodType<components['schemas']['LevelTestStartResponse']>;
export const testResultSchema = z.object({
  attempt_id: z.uuid(),
  score: z.number().finite(),
  passed: z.boolean(),
  result_level: levelSchema.nullable(),
}) satisfies z.ZodType<components['schemas']['LevelTestResultResponse']>;
export type TestStart = z.infer<typeof testStartSchema>;
export type TestResult = z.infer<typeof testResultSchema>;
export type Level = z.infer<typeof levelSchema>;
export function buildTestSubmission(
  attempt: TestStart,
  answers: Record<number, unknown>,
): components['schemas']['LevelTestSubmit'] {
  if (!attempt.questions.length) throw new Error('Empty test');
  return {
    answers: attempt.questions.map((question) => {
      const answer = answers[question.id];
      if (
        (question.type === 'choice' || question.type === 'match') &&
        !canSubmitAnswer(question, answer)
      )
        throw new Error('Incomplete or invalid visual answer');
      if (
        answer === undefined ||
        answer === null ||
        (typeof answer === 'string' && !answer.trim())
      )
        throw new Error('Missing answer');
      return { question_id: question.id, answer };
    }),
  };
}
