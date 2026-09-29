/** Only implemented protected destinations are accepted; reject external URLs and auth loops. */
export function safeAuthRedirect(value: string | null | undefined) {
  if (
    !value ||
    !/^\/(?:dashboard|onboarding|learning-path|level-tests(?:\/[1-9]\d*)?|admin(?:\/import)?|achievements|challenges|leaderboard|progress|profile|settings|community|friends|chats(?:\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?|users\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|courses(?:\/[1-9]\d*)?|lessons\/[1-9]\d*)(?:[?#]|$)/.test(
      value,
    ) ||
    value.includes('\\')
  )
    return '/dashboard';
  return value;
}
