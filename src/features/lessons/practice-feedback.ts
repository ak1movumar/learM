import { beginnerCourse } from '@/features/admin/course-import/beginner-course';
import { elementaryCourse } from '@/features/admin/course-import/elementary-course';
import type { Exercise } from './contracts';

// Only match exact authored content; never infer an answer from a question or ID.
const material = [
  ...beginnerCourse.lessons,
  ...elementaryCourse.lessons,
].flatMap((lesson) => lesson.exercises);
export function practiceFeedback(exercise: Exercise) {
  const source = material.find(
    (task) =>
      task.type === exercise.type && task.question === exercise.question,
  );
  return source
    ? {
        answer: source.correct_answer,
        explanation: source.question.split('\n\n')[0],
      }
    : null;
}

export const practiceCopy = {
  ru: {
    unknown: 'Не знаю',
    hint: 'Попробуйте ещё раз. Обратите внимание на правило и контекст задания.',
    answer: 'Правильный ответ',
    missing:
      'Для этого задания пока нет разбора. Можно продолжить и вернуться к нему при повторении.',
    review: 'Повторение ошибок',
    done: 'Практика завершена',
    doneHint:
      'Вы прошли задания и повторили ошибки. Сохранённый результат показан ниже.',
  },
  en: {
    unknown: 'I don’t know',
    hint: 'Try again. Check the rule and the context of the question.',
    answer: 'Correct answer',
    missing:
      'An explanation is not available for this exercise yet. Continue and revisit it during review.',
    review: 'Review mistakes',
    done: 'Practice finished',
    doneHint:
      'You worked through the exercises and reviewed mistakes. Your saved result is shown below.',
  },
  ky: {
    unknown: 'Билбейм',
    hint: 'Дагы аракет кылыңыз. Эрежеге жана тапшырманын маанисине көңүл буруңуз.',
    answer: 'Туура жооп',
    missing:
      'Бул тапшырманын түшүндүрмөсү азырынча жок. Улантып, кайталоодо кайра аракет кылсаңыз болот.',
    review: 'Каталарды кайталоо',
    done: 'Машыгуу аяктады',
    doneHint:
      'Тапшырмаларды аткарып, каталарды кайталадыңыз. Сакталган жыйынтык төмөндө көрсөтүлгөн.',
  },
};
