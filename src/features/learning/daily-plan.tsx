'use client';
import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/surface';
import { LinkButton } from '@/components/ui/link-button';
import { useI18n } from '@/providers/i18n-provider';
import { experienceCopy } from '@/i18n/experience';
import { readOnboarding } from '@/features/onboarding/storage';
export function DailyPlan({ userId }: { userId: string }) {
  const [plan] = useState(() => readOnboarding(userId));
  const { locale } = useI18n();
  const t = experienceCopy[locale];
  if (!plan.completed) return null;
  return (
    <Card>
      <Clock3 size={24} aria-hidden="true" />
      <h2>{t.plan}</h2>
      <p>
        <strong>{plan.minutes}</strong> {t.minutes}
      </p>
      <small>{t.local}</small>
      <div>
        <LinkButton href="/onboarding" variant="ghost">
          {t.change}
        </LinkButton>
      </div>
    </Card>
  );
}
