'use client';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  MessageCircle,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Logo } from '@/components/layout/logo';
import { CommunityBadge } from '@/components/layout/community-badge';
import { communityCopy } from './community-copy';
import { LinkButton } from '@/components/ui/link-button';
import { Card } from '@/components/ui/surface';
import { PublicHeader } from './public-header';
import { LanguageArt } from './language-art';
import { CatalogPreview } from './catalog-preview';
import { LearningExperience, ProgressPreview } from './experience';
import { WaveDivider } from './wave-divider';
import { Reveal } from './reveal';
import { ScrollToTopButton } from './scroll-to-top-button';
import styles from './landing.module.scss';
export function LandingPage() {
  const {
    locale,
    messages: { landing: t },
  } = useI18n();
  const community = communityCopy[locale];
  const benefits = [
    { Icon: Compass, title: t.benefitOne, body: t.benefitOneBody },
    { Icon: BookOpen, title: t.benefitTwo, body: t.benefitTwoBody },
    { Icon: UsersRound, title: t.benefitThree, body: t.benefitThreeBody },
  ];
  const steps = [
    { title: t.stepOne, body: t.stepOneBody },
    { title: t.stepTwo, body: t.stepTwoBody },
    { title: t.stepThree, body: t.stepThreeBody },
  ];
  return (
    <div className={styles.page}>
      <PublicHeader />
      <main id="main-content">
        <div className={styles.heroFrame}>
          <section className={styles.hero}>
            <LanguageArt />
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <span />
                {t.eyebrow}
              </p>
              <h1>
                {t.heroTitle.split('\n').map((line, index) => (
                  <span key={line} data-accent={index > 0}>
                    {line}
                  </span>
                ))}
              </h1>
              <p className={styles.heroDescription}>{t.heroDescription}</p>
              <div className={styles.heroActions}>
                <LinkButton href="/register">
                  {t.start}
                  <ArrowRight size={18} />
                </LinkButton>
                <LinkButton href="#courses" variant="secondary">
                  {t.explore}
                  <ArrowUpRight size={17} />
                </LinkButton>
              </div>
              <p className={styles.heroNote}>
                <Sparkles size={15} />
                {t.heroNote}
              </p>
              <div className={styles.heroFeatures}>
                {benefits.map(({ Icon, title }) => (
                  <div key={title}>
                    <Icon size={20} />
                    <span>{title}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div className={styles.promiseStrip}>
            <span>
              <BookOpen size={20} />
              {t.benefitTwo}
            </span>
            <span>
              <Compass size={20} />
              {t.benefitOne}
            </span>
            <span>
              <UsersRound size={20} />
              {t.benefitThree}
            </span>
            <p>{t.journeyLabel}</p>
          </div>
          <WaveDivider />
        </div>
        <section id="features" className={styles.section}>
          <Reveal>
            <div className={styles.centerHeading}>
              <p className={styles.eyebrow}>{t.features}</p>
              <h2>{t.benefitsTitle}</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className={styles.benefits}>
              {benefits.map(({ Icon, title, body }, index) => (
                <Card key={title}>
                  <div className={styles.benefitIcon} data-tone={index}>
                    <Icon size={24} />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </Card>
              ))}
            </div>
          </Reveal>
        </section>
        <CatalogPreview />
        <section className={styles.section}>
          <Reveal>
            <div className={styles.centerHeading}>
              <p className={styles.eyebrow}>{t.howLabel}</p>
              <h2>{t.howTitle}</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className={styles.steps}>
              {steps.map((step, index) => (
                <div key={step.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
        <Reveal>
          <LearningExperience />
        </Reveal>
        <Reveal>
          <ProgressPreview />
        </Reveal>
        <Reveal>
          <section id="community" className={styles.community}>
            <div className={styles.communityArt} aria-hidden="true">
              <span>Hola!</span>
              <span>Салам!</span>
              <span>Hello!</span>
              <div>
                <MessageCircle size={66} strokeWidth={1} />
              </div>
              <i />
              <b />
            </div>
            <div>
              <p className={styles.eyebrow}>{t.communityLabel}</p>
              <a href="#about" className={styles.creatorCredit}>
                <CommunityBadge />
                <span>{community.made}</span>
              </a>
              <h2>{t.communityTitle}</h2>
              <p>{t.communityBody}</p>
              <LinkButton href="/register">
                {t.join}
                <ArrowRight size={17} />
              </LinkButton>
              <small>{t.communityNote}</small>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section id="about" className={styles.about}>
            <p className={styles.eyebrow}>{t.about}</p>
            <h2>{t.aboutTitle}</h2>
            <p>{t.aboutBody}</p>
            <div className={styles.creatorCard}>
              <CommunityBadge />
              <div>
                <p className={styles.eyebrow}>{community.made}</p>
                <h3>{community.title}</h3>
                <p>{community.body}</p>
                <LinkButton href="#community" variant="secondary">
                  {community.link}
                  <ArrowUpRight size={17} />
                </LinkButton>
              </div>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section className={styles.cta}>
            <Sparkles size={26} />
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaBody}</p>
            <LinkButton href="/register">
              {t.start}
              <ArrowRight size={18} />
            </LinkButton>
          </section>
        </Reveal>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Logo />
          <p>{t.footer}</p>
        </div>

        <nav className={styles.footerLinks} aria-label={t.about}>
          <a href="#about">{t.about}</a>
          <a href="#features">{t.features}</a>
          <a href="#courses">{t.courses}</a>
          <a href="#community">{t.community}</a>
        </nav>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} LearM</span>

          <a href="#about" className={styles.creatorCredit}>
            <CommunityBadge />
            <span>{community.made}</span>
          </a>
        </div>
      </footer>
      <ScrollToTopButton />
    </div>
  );
}