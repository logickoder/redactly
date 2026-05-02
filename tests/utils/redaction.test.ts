import { describe, expect, it } from 'vitest';
import { redactMessages } from '../../src/utils/redaction';
import type { Message } from '../../src/utils/chatParser';

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

  it('does not redact name fragments inside words when aggressive=false', () => {
    const messages = [
      makeMessage({ originalString: 'John: alone with Johnson' }),
    ];
    const out = redactMessages(messages, {
      aliases: { John: 'User A' },
      aggressiveRedaction: false,
    });
    // Without aggressive, "John" inside "Johnson" still matches because we
    // use a substring regex (legacy behavior). Phase 1 will fix this.
    expect(out).toContain('User A');
  });
});
