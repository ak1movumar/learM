'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { useI18n } from '@/providers/i18n-provider';
import { placementMessages } from '@/i18n/placement';
import { PageHeader } from '@/components/ui/surface';
import { LinkButton } from '@/components/ui/link-button';
import { EmptyState } from '@/components/ui/states';
import { CourseCard } from '@/features/courses/course-card';
import {
  Stats,
  WeeklyActivity,
  RecentActivity,
} from '@/features/progress/progress-widgets';
import { DailyPlan } from './daily-plan';
import { ContinueLearning } from './continue-learning';
import { coursesOptions, languagesOptions, useProgress } from './queries';
import { LearningShell } from './learning-shell';
import { LearningSkeleton, LearningError } from './data-state';
import styles from './learning.module.scss';
export function DashboardPage() {
  const { user } = useAuth();
  const {
    locale,
    messages: { learning: t },
  } = useI18n();
  const courses = useQuery(coursesOptions());
  const languages = useQuery(languagesOptions());
  const progress = useProgress();
  return (
    <LearningShell active="dashboard">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.welcome + (user ? ', ' + user.username : '') + '!'}
        description={t.dashboardHint}
        action={
          <LinkButton href="/learning-path" variant="secondary">
            {placementMessages[locale].title}
          </LinkButton>
        }
      />
      <div className={styles.dashboardLayout}>
        <div className={styles.dashboardMain}>
          <ContinueLearning />
          {user && <DailyPlan key={user.id} userId={user.id} />}
          <Stats />
        </div>
        <aside className={styles.dashboardAside}>
          {progress.data ? (
            <>
              <WeeklyActivity records={progress.data} />
              <RecentActivity records={progress.data} />
            </>
          ) : progress.isError ? (
            <LearningError onRetry={() => void progress.refetch()} />
          ) : (
            <LearningSkeleton />
          )}
        </aside>
      </div>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>{t.suggested}</h2>
          <LinkButton variant="ghost" href="/courses">
            {t.catalog}
          </LinkButton>
        </div>
        {courses.isPending ? (
          <LearningSkeleton />
        ) : courses.isError ? (
          <LearningError onRetry={() => void courses.refetch()} />
        ) : courses.data.length ? (
          <div className={styles.courseGrid}>
            {[...courses.data]
              .sort((a, b) => a.order - b.order)
              .slice(0, 3)
              .map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  language={
                    languages.data?.find(
                      (language) => language.id === course.language_id,
                    )?.name
                  }
                  progress={progress.data}
                />
              ))}
          </div>
        ) : (
          <EmptyState title={t.noCourses} description={t.noCoursesHint} />
        )}
      </section>
    </LearningShell>
  );
}
