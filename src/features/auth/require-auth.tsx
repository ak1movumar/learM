'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { Card, Skeleton } from '@/components/ui/surface';
import { ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { useAuth } from './auth-provider';
import { sessionStore } from './session';
import { authErrorMessage } from './errors';
import { safeAuthRedirect } from './redirect';
import styles from './auth.module.scss';
import { needsOnboarding } from '@/features/onboarding/storage';
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, hasSession, me, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const destination = safeAuthRedirect(pathname + (search ? '?' + search : ''));
  const {
    messages: { auth: t, ui },
  } = useI18n();
  useEffect(() => {
    if (ready && !hasSession)
      router.replace('/login?next=' + encodeURIComponent(destination));
  }, [ready, hasSession, router, destination]);
  useEffect(() => {
    if (
      user?.is_active &&
      pathname !== '/onboarding' &&
      needsOnboarding(user.id)
    )
      router.replace('/onboarding');
  }, [user, pathname, router]);
  if (!ready || !hasSession || me.isPending)
    return (
      <main
        id="main-content"
        className={styles.guard}
        role="status"
        aria-label={t.checkingSession}
      >
        <Card>
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <span className="sr-only">{t.checkingSession}</span>
        </Card>
      </main>
    );
  if (me.isError || !user)
    return (
      <main id="main-content" className={styles.guard}>
        <Card>
          <ErrorState
            title={t.sessionError}
            description={authErrorMessage(me.error, t)}
            retryLabel={ui.retry}
            onRetry={() => void me.refetch()}
          />
          <Button variant="ghost" onClick={() => sessionStore.clear()}>
            {t.backToLogin}
          </Button>
        </Card>
      </main>
    );
  if (!user.is_active)
    return (
      <main id="main-content" className={styles.guard}>
        <Card>
          <p>{t.forbidden}</p>
          <Button onClick={() => sessionStore.clear()}>{t.backToLogin}</Button>
        </Card>
      </main>
    );
  return children;
}
