'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CircleAlert, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/field';
import { login, register } from './api';
import { loginSchema, registerSchema } from './schemas';
import { sessionStore } from './session';
import { useAuth } from './auth-provider';
import { authErrorMessage } from './errors';
import { safeAuthRedirect } from './redirect';
import type { LoginInput, RegisterInput } from './contracts';
import styles from './auth.module.scss';
import {
  beginOnboarding,
  needsOnboarding,
} from '@/features/onboarding/storage';
export function LoginForm({
  next,
  registered = false,
  logoutWarning = false,
}: {
  next?: string;
  registered?: boolean;
  logoutWarning?: boolean;
}) {
  const {
    messages: { auth: t },
  } = useI18n();
  const router = useRouter();
  const auth = useAuth();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: { email: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (tokens) => {
      sessionStore.signIn(tokens.access_token, tokens.refresh_token);
      router.replace(safeAuthRedirect(next));
    },
  });
  useEffect(() => {
    if (auth.user?.is_active)
      router.replace(
        needsOnboarding(auth.user.id) ? '/onboarding' : safeAuthRedirect(next),
      );
  }, [auth.user, next, router]);
  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className={styles.form}
    >
      {registered && (
        <p className={styles.success} role="status">
          <CheckCircle2 size={19} />
          {t.registered}
        </p>
      )}
      {logoutWarning && (
        <p className={styles.error} role="status">
          {t.logoutWarning}
        </p>
      )}
      <Input
        label={t.email}
        placeholder={t.emailPlaceholder}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        disabled={mutation.isPending}
        {...field('email')}
      />
      <PasswordInput
        label={t.password}
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={mutation.isPending}
        {...field('password')}
      />
      {mutation.isError && (
        <p className={styles.error} role="alert">
          <CircleAlert size={19} />
          {authErrorMessage(mutation.error, t)}
        </p>
      )}
      <Button type="submit" size="lg" loading={mutation.isPending}>
        {t.login}
        <ArrowRight size={18} />
      </Button>
      <p className={styles.help}>{t.forgotNote}</p>
      <p className={styles.switch}>
        {t.noAccount} <Link href="/register">{t.registerLink}</Link>
      </p>
    </form>
  );
}
export function RegisterForm() {
  const {
    messages: { auth: t },
  } = useI18n();
  const router = useRouter();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema(t)),
    defaultValues: { email: '', username: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const user = await register(values);
      beginOnboarding(user.id);
      // Registration has succeeded even if the following sign-in request fails.
      try {
        return await login({ email: values.email, password: values.password });
      } catch {
        return null;
      }
    },
    onSuccess: (tokens) => {
      if (tokens) {
        sessionStore.signIn(tokens.access_token, tokens.refresh_token);
        router.replace('/onboarding');
      } else router.replace('/login?registered=1&next=%2Fonboarding');
    },
  });
  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className={styles.form}
    >
      <Input
        label={t.username}
        placeholder={t.usernamePlaceholder}
        autoComplete="username"
        error={errors.username?.message}
        disabled={mutation.isPending}
        {...field('username')}
      />
      <Input
        label={t.email}
        placeholder={t.emailPlaceholder}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        disabled={mutation.isPending}
        {...field('email')}
      />
      <PasswordInput
        label={t.password}
        autoComplete="new-password"
        hint={t.passwordHint}
        error={errors.password?.message}
        disabled={mutation.isPending}
        {...field('password')}
      />
      {mutation.isError && (
        <p className={styles.error} role="alert">
          <CircleAlert size={19} />
          {authErrorMessage(mutation.error, t)}
        </p>
      )}
      <Button type="submit" size="lg" loading={mutation.isPending}>
        {t.register}
        <ArrowRight size={18} />
      </Button>
      <p className={styles.help}>{t.secureNote}</p>
      <p className={styles.switch}>
        {t.hasAccount} <Link href="/login">{t.loginLink}</Link>
      </p>
    </form>
  );
}
