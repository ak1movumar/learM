'use client';
import { useRef, useState } from 'react';
import {
  useMutation,
  useIsMutating,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { useI18n } from '@/providers/i18n-provider';
import { sessionStore } from '@/features/auth/session';
import { deleteAccount } from './api';
import { accountError } from './errors';
import { getApiFailure } from '@/services/api/errors';
export function DeleteAccount() {
  const {
    messages: { account: t },
  } = useI18n();
  const [open, setOpen] = useState(false);
  const updating = useIsMutating({ mutationKey: ['accountUpdate'] }) > 0;
  const lock = useRef(false);
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: ['accountDelete'],
    retry: false,
    mutationFn: async () => {
      const generation = sessionStore.getSnapshot().generation;
      await deleteAccount();
      return generation;
    },
    onSuccess: (generation) => {
      if (sessionStore.getSnapshot().generation !== generation) return;
      sessionStore.clear();
      client.clear();
      router.replace('/');
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  return (
    <>
      <Button
        variant="danger"
        disabled={updating || mutation.isPending}
        onClick={() => {
          mutation.reset();
          setOpen(true);
        }}
      >
        {t.deleteAccount}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          if (lock.current || updating || mutation.isPending) return;
          lock.current = true;
          mutation.mutate();
        }}
        title={t.deleteTitle}
        description={t.deleteBody}
        confirmLabel={t.deleteAccount}
        loading={mutation.isPending}
        error={
          mutation.isError
            ? accountError(mutation.error, t) +
              ' · DELETE /users/me' +
              (getApiFailure(mutation.error).status
                ? ' · HTTP ' + getApiFailure(mutation.error).status
                : '')
            : undefined
        }
      />
    </>
  );
}
