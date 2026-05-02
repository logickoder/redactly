import { escapeRegex } from '../../lib/regex';
import type { NsfwSettings, NsfwStrategy, NsfwTier } from './types';
import { wordlist } from './wordlist';

const LEET_CLASSES: Record<string, string> = {
  a: 'a4@',
  e: 'e3',
  i: 'i1!|',
  o: 'o0',
  s: 's5$',
  t: 't7',
  l: 'l1|',
  b: 'b8',
  g: 'g9',
  u: 'u@*',
};

const buildLeetPattern = (word: string): string =>
  word
    .toLowerCase()
    .split('')
    .map((c) => {
      // Internal whitespace in multi-word phrases (e.g. "blow job") matches
      // one or more whitespace characters in the input.
      if (/\s/.test(c)) return '\\s+';
      const cls = LEET_CLASSES[c];
      if (cls) return `[${cls}]`;
      return escapeRegex(c);
    })
    .join('');

interface CompiledTier {
  tier: NsfwTier;
  regex: RegExp;
}

const compileTier = (tier: NsfwTier, words: string[]): CompiledTier | null => {
  const cleaned = words.map((w) => w.trim().toLowerCase()).filter(Boolean);
  if (cleaned.length === 0) return null;

  const sorted = [...new Set(cleaned)].sort((a, b) => b.length - a.length);
  const alternation = sorted.map(buildLeetPattern).join('|');
  return {
    tier,
    regex: new RegExp(`\\b(?:${alternation})\\b`, 'gi'),
  };
};

const SOFTEN_REPLACEMENTS: Record<NsfwTier, string> = {
  general: '[expletive]',
  slurs: '[REDACTED-SLUR]',
  violence: '[violent-term]',
};

const replacementFor = (tier: NsfwTier, strategy: NsfwStrategy): string => {
  // Slurs always use the strong replacement regardless of strategy.
  if (tier === 'slurs') return SOFTEN_REPLACEMENTS.slurs;
  if (strategy === 'soften') return SOFTEN_REPLACEMENTS[tier];
  return '[REDACTED]';
};

export interface CompiledNsfwRules {
  tiers: CompiledTier[];
  allowSet: Set<string>;
  strategy: NsfwStrategy;
}

export const compileNsfwRules = (
  settings: NsfwSettings,
): CompiledNsfwRules | null => {
  if (!settings.enabled) return null;

  const tiers: CompiledTier[] = [];
  const enabledKeys: NsfwTier[] = [];
  if (settings.tiers.general) enabledKeys.push('general');
  if (settings.tiers.slurs) enabledKeys.push('slurs');
  if (settings.tiers.violence) enabledKeys.push('violence');

  for (const tier of enabledKeys) {
    const compiled = compileTier(tier, wordlist[tier]);
    if (compiled) tiers.push(compiled);
  }

  if (settings.extraWords.length > 0) {
    const compiled = compileTier('general', settings.extraWords);
    if (compiled) tiers.push(compiled);
  }

  if (tiers.length === 0) return null;

  const allowSet = new Set(
    settings.allowList.map((w) => w.trim().toLowerCase()).filter(Boolean),
  );

  return { tiers, allowSet, strategy: settings.strategy };
};

export const applyNsfw = (text: string, settings: NsfwSettings): string => {
  const compiled = compileNsfwRules(settings);
  if (!compiled) return text;

  for (const { tier, regex } of compiled.tiers) {
    text = text.replace(regex, (match) => {
      if (compiled.allowSet.has(match.toLowerCase())) return match;
      return replacementFor(tier, compiled.strategy);
    });
  }
  return text;
};
