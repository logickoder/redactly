import { describe, expect, it } from 'vitest';
import { redactMessages } from '../../src/features/redaction';
import type { Message } from '../../src/features/chat';

const makeMessage = (overrides: Partial<Message>): Message => ({
  id: 'msg-1',
  date: null,
  sender: 'Alice',
  content: '',
  originalString: '',
  ...overrides,
});

describe('redactMessages', () => {
  it('returns empty string when no messages', () => {
    expect(
      redactMessages([], { aliases: {}, aggressiveRedaction: false }),
    ).toBe('');
  });

  it('replaces sender names case-insensitively', () => {
    const messages = [
      makeMessage({ originalString: 'Alice: hi Bob' }),
      makeMessage({ originalString: 'Bob: hello ALICE' }),
    ];
    const out = redactMessages(messages, {
      aliases: { Alice: 'User A', Bob: 'User B' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User A: hi User B\nUser B: hello User A');
  });

  it('does not match name fragments inside larger words', () => {
    const messages = [
      makeMessage({ originalString: 'Bob: alone with Johnson' }),
    ];
    const out = redactMessages(messages, {
      aliases: { John: 'User A', Bob: 'User B' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User B: alone with Johnson');
  });

  it('matches longer names before shorter ones (longest-first)', () => {
    const messages = [makeMessage({ originalString: 'Hi John and Johnson' })];
    const out = redactMessages(messages, {
      aliases: { John: 'User A', Johnson: 'User B' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('Hi User A and User B');
  });

  it('redacts name parts under aggressive mode', () => {
    const messages = [
      makeMessage({ originalString: 'Bob the Builder: hi from Bob' }),
    ];
    const out = redactMessages(messages, {
      aliases: { 'Bob the Builder': 'User A' },
      aggressiveRedaction: true,
    });
    expect(out).toBe('User A: hi from User A');
  });

  it('does not split parts shorter than 3 chars in aggressive mode', () => {
    const messages = [makeMessage({ originalString: 'Mr Bo: also bo here' })];
    const out = redactMessages(messages, {
      aliases: { 'Mr Bo': 'User A' },
      aggressiveRedaction: true,
    });
    expect(out).toBe('User A: also bo here');
  });

  it('handles Cyrillic names with proper word boundaries', () => {
    const messages = [makeMessage({ originalString: 'Анна: привет Иван!' })];
    const out = redactMessages(messages, {
      aliases: { Анна: 'User A', Иван: 'User B' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User A: привет User B!');
  });

  it('does not redact Cyrillic name as substring of larger Cyrillic word', () => {
    const messages = [makeMessage({ originalString: 'Анна: Аннаполис' })];
    const out = redactMessages(messages, {
      aliases: { Анна: 'User A' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User A: Аннаполис');
  });

  it('handles accented Latin names', () => {
    const messages = [makeMessage({ originalString: 'José: hola Renée' })];
    const out = redactMessages(messages, {
      aliases: { José: 'User A', Renée: 'User B' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User A: hola User B');
  });

  it('escapes regex special characters in names', () => {
    const messages = [
      makeMessage({ originalString: 'Dr. Smith: hello (caller) here' }),
    ];
    const out = redactMessages(messages, {
      aliases: { 'Dr. Smith': 'User A' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User A: hello (caller) here');
  });

  it('skips empty aliases', () => {
    const messages = [makeMessage({ originalString: 'Alice: text' })];
    const out = redactMessages(messages, {
      aliases: { Alice: '' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('Alice: text');
  });

  it('filters by date range inclusive', () => {
    const inRange = makeMessage({
      id: '1',
      originalString: 'Alice: in',
      date: new Date('2024-03-15T10:00:00Z'),
    });
    const before = makeMessage({
      id: '2',
      originalString: 'Alice: before',
      date: new Date('2024-01-01T00:00:00Z'),
    });
    const after = makeMessage({
      id: '3',
      originalString: 'Alice: after',
      date: new Date('2024-12-31T23:00:00Z'),
    });
    const out = redactMessages([before, inRange, after], {
      aliases: { Alice: 'User A' },
      aggressiveRedaction: false,
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    });
    expect(out).toBe('User A: in');
  });

  it('keeps undated messages when filtering by date', () => {
    const undated = makeMessage({ id: '1', originalString: 'Alice: x' });
    const out = redactMessages([undated], {
      aliases: { Alice: 'User A' },
      aggressiveRedaction: false,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(out).toBe('User A: x');
  });

  it('applies PII detectors after name redaction', () => {
    const messages = [
      makeMessage({
        originalString:
          'Alice: ping me at alice@example.com or +1 555-010-2345',
      }),
    ];
    const out = redactMessages(messages, {
      aliases: { Alice: 'User A' },
      aggressiveRedaction: false,
      pii: { email: true, url: true, phone: true },
    });
    expect(out).toBe('User A: ping me at User [EMAIL] or [PHONE]');
  });

  it('leaves PII alone when pii settings absent', () => {
    const messages = [
      makeMessage({ originalString: 'Alice: visit https://x.io' }),
    ];
    const out = redactMessages(messages, {
      aliases: { Alice: 'User A' },
      aggressiveRedaction: false,
    });
    expect(out).toBe('User A: visit https://x.io');
  });
});
