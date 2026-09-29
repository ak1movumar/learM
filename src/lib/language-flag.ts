/** A regional flag is a UI convention, not a unique country for a language. */
export function languageRegion(code: string): string | null {
  try {
    const locale = new Intl.Locale(code.trim().replaceAll('_', '-'));
    if (!locale.language || locale.language === 'und') return null;
    // Keep LearM's existing British flag for English without an explicit region.
    const region =
      locale.region ??
      (locale.language === 'en' ? 'GB' : locale.maximize().region);
    return region && /^[A-Z]{2}$/.test(region) && region !== 'ZZ'
      ? region.toLowerCase()
      : null;
  } catch {
    return null;
  }
}
export function languageFlagSource(code: string): string | null {
  const region = languageRegion(code);
  if (!region) return null;
  return region === 'gb'
    ? '/flags/gb.png'
    : `https://flagcdn.com/w160/${region}.png`;
}
