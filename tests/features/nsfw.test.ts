import { describe, expect, it } from 'vitest';
import {
  applyNsfw,
  defaultNsfwSettings,
  type NsfwSettings,
} from '../../src/features/nsfw';

const baseEnabled: NsfwSettings = {
  ...defaultNsfwSettings,
  enabled: true,
  tiers: { general: true, slurs: true, violence: true },
};

describe('applyNsfw — disabled', () => {
  it('passes through when disabled', () => {
    const text = 'this is fucking awful';
    expect(applyNsfw(text, defaultNsfwSettings)).toBe(text);
  });
});

describe('applyNsfw — tiers', () => {
  it('masks profanity', () => {
    const out = applyNsfw('this is fucking awful', baseEnabled);
    expect(out).toBe('this is [REDACTED] awful');
  });

  it('masks sexual content', () => {
    const out = applyNsfw('saw a porn video', baseEnabled);
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('porn');
  });

  it('masks violence terms', () => {
    const out = applyNsfw('I will stab him', baseEnabled);
    expect(out).toBe('I will [REDACTED] him');
  });

  it('skips violence tier when disabled', () => {
    const settings: NsfwSettings = {
      ...baseEnabled,
      tiers: { ...baseEnabled.tiers, violence: false },
    };
    expect(applyNsfw('I will stab him', settings)).toBe('I will stab him');
  });
});

describe('applyNsfw — strategy', () => {
  it('mask strategy returns [REDACTED] for non-slur tiers', () => {
    const out = applyNsfw('this is fucking awful', {
      ...baseEnabled,
      strategy: 'mask',
    });
    expect(out).toBe('this is [REDACTED] awful');
  });

  it('soften strategy returns per-tier replacement', () => {
    const out = applyNsfw('this is fucking awful', {
      ...baseEnabled,
      strategy: 'soften',
    });
    expect(out).toBe('this is [expletive] awful');
  });

  it('slurs always use [REDACTED-SLUR] regardless of strategy', () => {
    // Decoded slur from the seed list (n-word) — used here only to verify the
    // detection path; not displayed in source.
    const slur = atob('bmlnZ2Vy');
    const text = `text with ${slur} in it`;
    const masked = applyNsfw(text, { ...baseEnabled, strategy: 'mask' });
    const softened = applyNsfw(text, { ...baseEnabled, strategy: 'soften' });
    expect(masked).toBe('text with [REDACTED-SLUR] in it');
    expect(softened).toBe('text with [REDACTED-SLUR] in it');
  });
});

describe('applyNsfw — leetspeak', () => {
  it('matches f@ck', () => {
    expect(applyNsfw('what the f@ck', baseEnabled)).toBe(
      'what the [REDACTED]',
    );
  });

  it('matches 5h1t', () => {
    expect(applyNsfw('5h1t happens', baseEnabled)).toBe('[REDACTED] happens');
  });

  it('matches mixed-case BiTcH', () => {
    expect(applyNsfw('such BiTcH energy', baseEnabled)).toBe(
      'such [REDACTED] energy',
    );
  });
});

describe('applyNsfw — allowlist', () => {
  it('does not redact words on the allowlist', () => {
    const out = applyNsfw('the team is doing great work', {
      ...baseEnabled,
      allowList: ['scunthorpe'],
    });
    expect(out).toBe('the team is doing great work');
  });

  it('respects allowlist for words that would otherwise match', () => {
    // Use "ass" via "Cassidy" which would match if we used substring; with \b
    // boundaries it doesn't, so this is more about confirming the allow path:
    const out = applyNsfw('damn good time', {
      ...baseEnabled,
      allowList: ['damn'],
    });
    expect(out).toBe('damn good time');
  });
});

describe('applyNsfw — extra words', () => {
  it('redacts user-supplied extra words', () => {
    const out = applyNsfw('this product is widget-trash', {
      ...baseEnabled,
      extraWords: ['widget'],
    });
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('widget');
  });
});

describe('applyNsfw — false-positive guard', () => {
  it('leaves benign text unchanged', () => {
    const text =
      'Meeting tomorrow at 3pm. Please bring the report and we will review the budget plan together.';
    expect(applyNsfw(text, baseEnabled)).toBe(text);
  });

  it('does not match within larger words (e.g. ass in class)', () => {
    const text = 'this class is great';
    expect(applyNsfw(text, baseEnabled)).toBe(text);
  });
});

describe('applyNsfw — word boundaries', () => {
  it('only matches whole words', () => {
    expect(applyNsfw('grasshopper', baseEnabled)).toBe('grasshopper');
  });
});
