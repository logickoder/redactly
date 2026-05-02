import { describe, expect, it } from 'vitest';
import { applyPii, defaultPiiSettings } from '../../src/features/pii';

const allOn = { email: true, url: true, phone: true };

describe('applyPii — disabled by default', () => {
  it('leaves text untouched when no flags set', () => {
    const text = 'Reach me at alice@example.com or +1 555-010-2345 — also https://x.io';
    expect(applyPii(text, defaultPiiSettings)).toBe(text);
  });
});

describe('applyPii — emails', () => {
  it('masks single email', () => {
    expect(applyPii('Send to alice@example.com please', { ...defaultPiiSettings, email: true })).toBe(
      'Send to [EMAIL] please',
    );
  });

  it('masks multiple emails', () => {
    expect(
      applyPii('a@b.io and x.y+tag@c.co.uk', { ...defaultPiiSettings, email: true }),
    ).toBe('[EMAIL] and [EMAIL]');
  });
});

describe('applyPii — URLs', () => {
  it('masks https links', () => {
    expect(applyPii('See https://example.com/path?q=1', { ...defaultPiiSettings, url: true })).toBe(
      'See [LINK]',
    );
  });

  it('masks http links', () => {
    expect(applyPii('http://insecure.test ok', { ...defaultPiiSettings, url: true })).toBe(
      '[LINK] ok',
    );
  });
});

describe('applyPii — phones', () => {
  it('masks international phone', () => {
    expect(applyPii('Call +1 (555) 010-2345', { ...defaultPiiSettings, phone: true })).toBe(
      'Call [PHONE]',
    );
  });

  it('masks bare 10-digit run', () => {
    expect(applyPii('try 5550102345 thanks', { ...defaultPiiSettings, phone: true })).toBe(
      'try [PHONE] thanks',
    );
  });

  it('does not mask short numbers', () => {
    expect(applyPii('order 42 cookies', { ...defaultPiiSettings, phone: true })).toBe(
      'order 42 cookies',
    );
  });
});

describe('applyPii — combined order', () => {
  it('emails do not get sliced by phone pattern', () => {
    const text = 'a@b.io and 5550102345';
    expect(applyPii(text, allOn)).toBe('[EMAIL] and [PHONE]');
  });

  it('URLs do not collapse to phone match', () => {
    const text = 'see https://x.io/12345678901234567890';
    expect(applyPii(text, allOn)).toBe('see [LINK]');
  });
});
