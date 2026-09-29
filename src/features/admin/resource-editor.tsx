'use client';
import { useAuth } from '@/features/auth/auth-provider';
import { useI18n } from '@/providers/i18n-provider';
import { adminErrorMessage } from './errors';
import { labels } from '@/i18n/management';
import { Button } from '@/components/ui/button';
import styles from './admin.module.scss';
import { Save } from 'lucide-react';
import { adminCopy, resourceIcons } from './presentation';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionStore } from '@/features/auth/session';
import { Input, Select, Textarea } from '@/components/ui/field';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import {
  resources,
  saveResource,
  getResourceRows,
  type Resource,
} from './resources';
import fieldsData from './fields.json';
import { buildPayload, type Field, type Row } from './model';
import { ExerciseDraftPreview } from './exercise-draft-preview';
import { languagePayload } from './language-payload';
export function ResourceEditor({
  resource,
  parentTest,
  row,
  onClose,
}: {
  resource: Resource;
  parentTest?: string;
  row: Row | 'new';
  onClose: () => void;
}) {
  const {
    locale,
    messages: { account },
  } = useI18n();
  const t = labels[locale];
  const copy = adminCopy[locale];
  const Icon = resourceIcons[resource];
  const { user } = useAuth();
  const client = useQueryClient();
  const lock = useRef(false);
  const schemaName =
    resource === 'level-tests' && row !== 'new'
      ? 'LevelTestUpdate'
      : resources[resource];
  const fields: Field[] = schemaName
    ? fieldsData[schemaName]
    : [
        {
          key: 'role',
          type: 'string',
          required: true,
          choices: ['user', 'admin'],
        },
        { key: 'is_active', type: 'boolean', required: true },
      ];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const value = row === 'new' ? field.initial : row[field.key];
        return [
          field.key,
          value === undefined ||
          (value === null && !['json', 'object'].includes(field.type))
            ? ''
            : field.type === 'json' || typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : String(value),
        ];
      }),
    ),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [invalid, setInvalid] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  const parent: Resource | null =
    resource === 'courses' || resource === 'level-tests'
      ? 'languages'
      : resource === 'lessons'
        ? 'courses'
        : resource === 'exercises'
          ? 'lessons'
          : null;
  const parents = useQuery({
    queryKey: ['admin', parent, user?.id],
    queryFn: ({ signal }) => getResourceRows(parent!, signal),
    enabled: !!parent,
  });
  const mutation = useMutation({
    retry: false,
    mutationFn: async (payload: Record<string, unknown>) => {
      return saveResource(resource, row, payload, parentTest);
    },
    onSuccess: async (generation) => {
      if (generation !== sessionStore.getSnapshot().generation) return;
      onClose();
      await client.invalidateQueries();
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  return (
    <>
      <Modal
        open
        className={styles.editor}
        title={(row === 'new' ? t.create : t.edit) + ' · ' + t[resource]}
        onClose={() => {
          if (!mutation.isPending) {
            if (dirty) setDiscard(true);
            else onClose();
          }
        }}
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (lock.current) return;
            setInvalid(false);
            try {
              const rawPayload = buildPayload(fields, values, row !== 'new');
              const payload =
                resource === 'languages'
                  ? languagePayload(rawPayload)
                  : rawPayload;
              if (resource === 'level-tests') {
                if (
                  payload.passing_score !== undefined &&
                  (Number(payload.passing_score) < 1 ||
                    Number(payload.passing_score) > 100)
                )
                  throw new Error('Invalid passing score');
                if (
                  row === 'new' &&
                  payload.is_placement === false &&
                  !payload.target_level
                )
                  throw new Error('Target level required');
                if (row === 'new' && payload.is_placement === true)
                  payload.target_level = null;
                if (row !== 'new' && !values.target_level)
                  payload.target_level = null;
              }
              if (
                resource === 'test-questions' &&
                payload.order !== undefined &&
                Number(payload.order) < 1
              )
                throw new Error('Invalid order');
              lock.current = true;
              mutation.mutate(payload);
            } catch {
              setInvalid(true);
              setTouched(
                Object.fromEntries(fields.map((field) => [field.key, true])),
              );
            }
          }}
        >
          <div className={styles.editorIntro}>
            <span className={styles.resourceIcon}>
              <Icon size={24} />
            </span>
            <p>{copy.required}</p>
          </div>
          {(resource === 'exercises' || resource === 'test-questions') && (
            <details className={styles.hint}>
              <summary>{copy.format}</summary>
              <p>{t.jsonHint}</p>
              {['choice', 'match'].includes(values.type ?? '') && (
                <>
                  <strong>{t.options}</strong>
                  <pre
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                  >
                    {JSON.stringify(
                      values.type === 'choice'
                        ? { A: 'Яблоко', B: 'Груша' }
                        : {
                            left: { apple: 'apple', pear: 'pear' },
                            right: { r1: 'груша', r2: 'яблоко' },
                          },
                      null,
                      2,
                    )}
                  </pre>
                  <strong>{t.correct_answer}</strong>
                  <pre>
                    {JSON.stringify(
                      values.type === 'choice'
                        ? 'A'
                        : { apple: 'r2', pear: 'r1' },
                      null,
                      2,
                    )}
                  </pre>
                </>
              )}
            </details>
          )}
          {fields.map((field) => {
            const label = t[field.key as keyof typeof t] ?? field.key;
            let fieldInvalid = false;
            if (touched[field.key]) {
              try {
                buildPayload([field], values, row !== 'new');
              } catch {
                fieldInvalid = true;
              }
            }
            const common = {
              error: fieldInvalid ? t.invalid : undefined,
              label: label + (field.required ? ' *' : ''),
              className: [
                'description',
                'question',
                'options',
                'correct_answer',
                'conditions',
                'title',
                'name',
              ].includes(field.key)
                ? styles.fullField
                : undefined,
              value: values[field.key] ?? '',
              disabled:
                mutation.isPending ||
                (resource === 'users' && row !== 'new' && row.id === user?.id),
              required:
                (field.required ||
                  (resource === 'test-questions' &&
                    field.key === 'question')) &&
                !(row !== 'new' && field.key === 'correct_answer'),
              onChange: (
                event: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >,
              ) => {
                setDirty(true);
                setTouched((current) => ({ ...current, [field.key]: true }));
                setValues({ ...values, [field.key]: event.target.value });
              },
            };
            if (field.key.endsWith('_id') && parent)
              return (
                <Select key={field.key} {...common}>
                  <option value="">
                    {parents.isError
                      ? t.error
                      : parents.isPending
                        ? t.loading
                        : t.choose}
                  </option>
                  {row !== 'new' &&
                    values[field.key] &&
                    !parents.data?.some(
                      (item) => String(item.id) === values[field.key],
                    ) && (
                      <option value={values[field.key]}>
                        #{values[field.key]}
                      </option>
                    )}
                  {parents.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {String(item.name ?? item.title ?? item.id)} (#{item.id})
                    </option>
                  ))}
                </Select>
              );
            if (field.choices || field.type === 'boolean')
              return (
                <Select key={field.key} {...common}>
                  <option value="">{t.choose}</option>
                  {(field.choices ?? ['true', 'false']).map((value) => (
                    <option key={value} value={value}>
                      {field.type === 'boolean'
                        ? value === 'true'
                          ? copy.yes
                          : copy.no
                        : value}
                    </option>
                  ))}
                </Select>
              );
            if (
              ['object', 'json'].includes(field.type) ||
              ['description', 'question'].includes(field.key)
            )
              return <Textarea key={field.key} {...common} rows={5} />;
            return (
              <Input
                key={field.key}
                {...common}
                placeholder={
                  resource === 'languages'
                    ? field.key === 'code'
                      ? 'ru / ky / en'
                      : field.key === 'name'
                        ? 'Русский / Кыргызча / English'
                        : undefined
                    : undefined
                }
                type={
                  field.type === 'integer'
                    ? 'number'
                    : field.format === 'date'
                      ? 'date'
                      : 'text'
                }
                step={field.type === 'integer' ? 1 : undefined}
              />
            );
          })}
          {(resource === 'exercises' || resource === 'test-questions') && (
            <ExerciseDraftPreview
              key={[values.type, values.options, values.question].join('|')}
              values={values}
            />
          )}
          {(invalid || mutation.isError) && (
            <p role="alert" className={styles.error}>
              {invalid ? t.invalid : adminErrorMessage(mutation.error, locale)}
            </p>
          )}
          <div className={styles.editorActions}>
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={() => (dirty ? setDiscard(true) : onClose())}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={
                resource === 'users' && row !== 'new' && row.id === user?.id
              }
            >
              <Save size={17} />
              {t.save}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={discard}
        title={account.discardTitle}
        description={account.discardBody}
        confirmLabel={account.discard}
        onClose={() => setDiscard(false)}
        onConfirm={onClose}
      />
    </>
  );
}
