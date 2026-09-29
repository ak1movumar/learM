export function languagePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const code =
    typeof payload.code === 'string' ? payload.code.trim().toLowerCase() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!code || !name) throw new Error('Language code and name are required');
  return { ...payload, code, name };
}
