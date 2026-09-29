import test from 'node:test';
import assert from 'node:assert/strict';
import { languageRegion, languageFlagSource } from '../src/lib/language-flag';
test('language flags use likely regions and preserve English preference', () => {
  for (const [code, region] of Object.entries({
    en: 'gb',
    ky: 'kg',
    ru: 'ru',
    ja: 'jp',
    ko: 'kr',
    zh: 'cn',
    tr: 'tr',
    fr: 'fr',
    de: 'de',
    es: 'es',
    it: 'it',
  }))
    assert.equal(languageRegion(code), region);
  assert.equal(languageFlagSource('en'), '/flags/gb.png');
  assert.equal(languageFlagSource('ky'), 'https://flagcdn.com/w160/kg.png');
});
test('explicit regions win; case, whitespace, script and underscore codes are supported', () => {
  for (const [code, region] of Object.entries({
    ' en-US ': 'us',
    EN_gb: 'gb',
    'pt-BR': 'br',
    'fr-CA': 'ca',
    'zh-Hant': 'tw',
    'en-Latn': 'gb',
  }))
    assert.equal(languageRegion(code), region);
});
test('invalid, unknown and non-country regions have a neutral fallback', () => {
  for (const code of [
    '',
    '???',
    'Русский',
    '../ru',
    'und',
    'zz',
    'es-419',
    'en-ZZ',
  ])
    assert.equal(languageFlagSource(code), null);
});
