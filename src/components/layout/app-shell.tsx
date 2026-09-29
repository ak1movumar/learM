'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/modal';
import { LanguageSwitcher, ThemeSwitcher } from '@/components/ui/preferences';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Header } from './header';
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed';
import { communityCopy } from '@/features/landing/community-copy';
import { navigation, type NavigationKey } from './navigation';
import styles from './layout.module.scss';
export function AppShell({
  children,
  active = 'dashboard',
  onNavigate,
  title,
  badge,
  identity,
  action,
}: {
  children: ReactNode;
  active?: NavigationKey;
  onNavigate?: (key: NavigationKey) => void;
  title?: string;
  badge?: string | null;
  identity?: { name: string; description: string };
  action?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [menu, setMenu] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const {
    locale,
    messages: { nav, ui, studio },
  } = useI18n();
  return (
    <div className={cn(styles.shell, collapsed && styles.shellCollapsed)}>
      <Sidebar
        active={active}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        onNavigate={onNavigate}
        identity={identity}
      />
      <div className={styles.workspace}>
        <Header
          onMenu={() => setMenu(true)}
          onPreferences={() => setPreferences(true)}
          title={title}
          badge={badge}
          action={action}
        />
        <main id="main-content" tabIndex={-1} className={styles.main}>
          {children}
        </main>
        <footer className={styles.footer}>
          {studio.footer}
          <Link href="/#about">
            © {new Date().getFullYear()} LearM · {communityCopy[locale].made}
          </Link>
        </footer>
      </div>
      <MobileBottomNav active={active} onNavigate={onNavigate} />
      <Modal open={menu} onClose={() => setMenu(false)} title={nav.navigation}>
        <nav className={styles.mobileMenu}>
          {navigation.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              onClick={(event) => {
                setMenu(false);
                if (onNavigate) {
                  event.preventDefault();
                  onNavigate(key);
                }
              }}
            >
              <Icon size={18} />
              {nav[key]}
            </Link>
          ))}
        </nav>
        <div className={styles.preferenceContent}>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </Modal>
      <Modal
        open={preferences}
        onClose={() => setPreferences(false)}
        title={ui.appearance}
        description={studio.preferencesHint}
      >
        <div className={styles.preferenceContent}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </Modal>
    </div>
  );
}
