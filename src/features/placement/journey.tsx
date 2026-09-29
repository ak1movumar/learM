'use client';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Check, LockKeyhole, Play } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { experienceCopy } from '@/i18n/experience';
import { placementMessages } from '@/i18n/placement';
import { Card, Badge, ProgressBar } from '@/components/ui/surface';
import { LinkButton } from '@/components/ui/link-button';
import { useProgress } from '@/features/learning/queries';
import { courseProgress, progressByLesson } from '@/features/progress/model';
import type { components } from '@/types/api.generated';
import styles from './path.module.scss';

export function LearningJourney({
  courses,
  placementCompleted,
}: {
  courses: components['schemas']['LearningCourseResponse'][];
  placementCompleted: boolean;
}) {
  const {
    locale,
    messages: { learning: learning },
  } = useI18n();
  const t = placementMessages[locale];
  const progress = useProgress();
  const indexed = progressByLesson(progress.data ?? []);
  return (
    <ol className={styles.journey}>
      {[...courses]
        .sort((a, b) => a.order - b.order || a.id - b.id)
        .map((course) => {
          const stats = progress.data
            ? courseProgress(course.lessons, progress.data)
            : undefined;
          return (
            <li
              key={course.id}
              className={styles.stop}
              data-locked={!course.is_unlocked}
            >
              <span className={styles.marker} aria-hidden="true">
                {course.is_unlocked ? (
                  <BookOpen size={23} />
                ) : (
                  <LockKeyhole size={21} />
                )}
              </span>
              <Card className={styles.course}>
                <div className={styles.courseHeader}>
                  <Badge tone={course.is_unlocked ? 'primary' : 'neutral'}>
                    {course.level}
                  </Badge>
                  {course.is_unlocked && (
                    <span>
                      {course.lessons.length} · {learning.lessons}
                    </span>
                  )}
                </div>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                {stats && stats.total > 0 && (
                  <div className={styles.progress}>
                    <ProgressBar
                      value={stats.percent}
                      label={learning.courseProgress}
                    />
                    <small>
                      {stats.completed} / {stats.total} · {learning.completed}
                    </small>
                  </div>
                )}
                {!course.is_unlocked && (
                  <p>{placementCompleted ? t.completionHint : t.needed}</p>
                )}
                {course.is_unlocked ? (
                  <LinkButton href={'/courses/' + course.id}>
                    {t.open}
                    <ArrowUpRight size={17} />
                  </LinkButton>
                ) : !placementCompleted ? (
                  <LinkButton href={'/level-tests/' + course.language_id}>
                    {t.start}
                    <ArrowUpRight size={17} />
                  </LinkButton>
                ) : (
                  <span className={styles.locked}>
                    <LockKeyhole size={15} />
                    {t.locked}
                  </span>
                )}
                {course.is_unlocked && course.lessons.length > 0 && (
                  <details className={styles.lessons}>
                    <summary>
                      {learning.lessons}
                      <span>{course.lessons.length}</span>
                    </summary>
                    <ol>
                      {[...course.lessons]
                        .sort((a, b) => a.order - b.order || a.id - b.id)
                        .map((lesson) => (
                          <li key={lesson.id}>
                            {lesson.is_locked ? (
                              <span
                                aria-disabled="true"
                                title={experienceCopy[locale].locked}
                              >
                                <LockKeyhole size={16} />
                                {lesson.title}
                              </span>
                            ) : (
                              <Link href={'/lessons/' + lesson.id}>
                                {indexed.get(lesson.id)?.completed ? (
                                  <Check size={17} />
                                ) : (
                                  <Play size={15} />
                                )}
                                {lesson.title}
                              </Link>
                            )}
                          </li>
                        ))}
                    </ol>
                  </details>
                )}
              </Card>
            </li>
          );
        })}
    </ol>
  );
}
