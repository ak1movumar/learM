'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { LanguageFlag } from '@/components/ui/language-flag';
import { useI18n } from '@/providers/i18n-provider';
import { getCourses, getLanguages } from '@/features/courses/catalog-api';
import { queryKeys } from '@/constants/query-keys';

import { Badge, Card, Skeleton } from '@/components/ui/surface';
import { LinkButton } from '@/components/ui/link-button';
import { ErrorState, EmptyState } from '@/components/ui/states';

import styles from './catalog-preview.module.scss';

export function CatalogPreview() {
  const {
    messages: { landing: t, ui },
  } = useI18n();

  const courses = useQuery({
    queryKey: queryKeys.courses,
    queryFn: ({ signal }) => getCourses(signal),
  });

  const languages = useQuery({
    queryKey: queryKeys.languages,
    queryFn: ({ signal }) => getLanguages(signal),
  });

  const activeLanguages =
    languages.data?.filter((language) => language.is_active) ?? [];

  return (
    <>
      <section className={styles.languages} aria-labelledby="languages-heading">
        <div>
          <p className={styles.eyebrow}>LearM</p>

          <h2 id="languages-heading">{t.languagesTitle}</h2>

          <p>{t.languagesDescription}</p>
        </div>

        <div className={styles.languageList}>
          {languages.isPending ? (
            <div role="status" aria-label={t.loadingCourses}>
              <Skeleton />
              <Skeleton />
            </div>
          ) : languages.isError ? (
            <ErrorState
              title={t.catalogError}
              description={t.catalogErrorBody}
              retryLabel={ui.retry}
              onRetry={() => void languages.refetch()}
            />
          ) : activeLanguages.length ? (
            activeLanguages.map((language) => (
              <a href="#courses" key={language.id}>
                <span className={styles.languageFlag}>
                  <LanguageFlag code={language.code} width={84} height={64} />
                </span>

                <span className={styles.languageName}>{language.name}</span>

                <span className={styles.languageCode}>
                  {language.code.toUpperCase()}
                </span>
              </a>
            ))
          ) : (
            <p>{t.languagesEmpty}</p>
          )}
        </div>
      </section>

      <section id="courses" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{t.courses}</p>

            <h2>{t.coursesTitle}</h2>

            <p>{t.coursesDescription}</p>
          </div>
        </div>

        {courses.isPending ? (
          <div
            className={styles.courseGrid}
            role="status"
            aria-label={t.loadingCourses}
          >
            {[0, 1, 2].map((index) => (
              <Card key={index} className={styles.courseLoading}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </Card>
            ))}
          </div>
        ) : courses.isError ? (
          <Card>
            <ErrorState
              title={t.catalogError}
              description={t.catalogErrorBody}
              retryLabel={ui.retry}
              onRetry={() => void courses.refetch()}
            />
          </Card>
        ) : courses.data.length ? (
          <div className={styles.courseGrid}>
            {courses.data.slice(0, 3).map((course) => {
              const language = languages.data?.find(
                (item) => item.id === course.language_id,
              );

              return (
                <Card key={course.id} className={styles.course}>
                  <div className={styles.courseTop}>
                    <span className={styles.courseIcon}>
                      {language ? (
                        <span className={styles.courseFlag}>
                          <LanguageFlag
                            code={language.code}
                            width={38}
                            height={28}
                          />
                        </span>
                      ) : (
                        <BookOpen size={25} />
                      )}
                    </span>

                    <Badge tone="primary">
                      {t.level} {course.level}
                    </Badge>
                  </div>

                  <h3>{course.title}</h3>

                  <p>{course.description}</p>

                  {language && (
                    <small className={styles.courseLanguage}>
                      <LanguageFlag
                        code={language.code}
                        width={22}
                        height={16}
                      />

                      {language.name}
                    </small>
                  )}

                  <LinkButton
                    href={`/courses/${course.id}`}
                    variant="secondary"
                  >
                    {t.courseAction}
                    <ArrowUpRight size={17} />
                  </LinkButton>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState
              title={t.coursesEmpty}
              description={t.coursesEmptyBody}
            />
          </Card>
        )}
      </section>
    </>
  );
}
