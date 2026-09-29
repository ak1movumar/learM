'use client';
import {
  Palette,
  Languages,
  ShieldCheck,
  UserRound,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLogout } from '@/features/auth/use-logout';
import { LearningShell } from '@/features/learning/learning-shell';
import { useI18n } from '@/providers/i18n-provider';
import { Card, PageHeader } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { ThemeSwitcher, LanguageSwitcher } from '@/components/ui/preferences';
import { PasswordForm } from './password-form';
import { DeleteAccount } from './delete-account';
import styles from './account.module.scss';
import { InstallCard } from '@/components/pwa/install-card';
export function SettingsPage() {
  const { user } = useAuth();
  const {
    messages: { account: t, auth },
  } = useI18n();
  const exit = useLogout();
  return (
    <LearningShell active="settings">
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.settings}
        description={t.settingsHint}
      />
      <div className={styles.settingsGrid}>
        <InstallCard />
        <Card className={styles.section}>
          <h2>
            <UserRound size={21} />
            {t.account}
          </h2>
          <p>{user?.email}</p>
          <LinkButton href="/profile" variant="secondary">
            {t.openProfile}
          </LinkButton>
        </Card>
        <Card className={styles.section}>
          <h2>
            <Palette size={21} />
            {t.appearance}
          </h2>
          <p>{t.appearanceHint}</p>
          <ThemeSwitcher />
        </Card>
        <Card className={styles.section}>
          <h2>
            <Languages size={21} />
            {t.language}
          </h2>
          <p>{t.languageHint}</p>
          <LanguageSwitcher />
        </Card>
        <Card className={styles.section}>
          <h2>
            <ShieldCheck size={21} />
            {t.security}
          </h2>
          <p>{t.securityHint}</p>
          <PasswordForm />
          <Button
            variant="secondary"
            loading={exit.isPending}
            onClick={() => exit.mutate()}
          >
            <LogOut size={17} />
            {auth.logout}
          </Button>
        </Card>
        <Card className={styles.danger}>
          <div>
            <h2>{t.danger}</h2>
            <p>{t.dangerHint}</p>
          </div>
          <DeleteAccount />
        </Card>
      </div>
    </LearningShell>
  );
}
