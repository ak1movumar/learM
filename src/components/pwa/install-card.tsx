'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Card } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from './pwa-provider';
import styles from './pwa.module.scss';
const copy = {
  ru: {
    title: 'LearM на главном экране',
    button: 'Установить приложение',
    done: 'Приложение установлено',
    hint: 'Открывайте обучение одним касанием с главного экрана телефона.',
    manual:
      'iPhone: откройте сайт в Safari → Поделиться → На экран «Домой». Android: меню браузера → Установить приложение или Добавить на главный экран.',
    error: 'Не удалось открыть установку. Попробуйте через меню браузера.',
  },
  en: {
    title: 'LearM on your home screen',
    button: 'Install app',
    done: 'App installed',
    hint: 'Open your learning with one tap from your phone’s home screen.',
    manual:
      'iPhone: open in Safari → Share → Add to Home Screen. Android: browser menu → Install app or Add to Home screen.',
    error: 'Could not open installation. Try the browser menu.',
  },
  ky: {
    title: 'LearM башкы экранда',
    button: 'Колдонмону орнотуу',
    done: 'Колдонмо орнотулду',
    hint: 'Телефондун башкы экранынан бир басуу менен үйрөнүүнү баштаңыз.',
    manual:
      'iPhone: Safari → Бөлүшүү → Башкы экранга кошуу. Android: браузердин менюсу → Колдонмону орнотуу же Башкы экранга кошуу.',
    error:
      'Орнотууну ачуу мүмкүн болгон жок. Браузердин менюсун колдонуп көрүңүз.',
  },
};
export function InstallCard() {
  const { locale } = useI18n();
  const t = copy[locale];
  const { installed, install } = usePwaInstall();
  const [error, setError] = useState(false);
  return (
    <Card className={styles.install}>
      <h2>
        <Download size={21} /> {t.title}
      </h2>
      <p>{installed ? t.done : t.hint}</p>
      {!installed &&
        (install ? (
          <Button
            onClick={async () => {
              try {
                await install();
              } catch {
                setError(true);
              }
            }}
          >
            {t.button}
          </Button>
        ) : (
          <p>{t.manual}</p>
        ))}
      {error && <p role="status">{t.error}</p>}
    </Card>
  );
}
