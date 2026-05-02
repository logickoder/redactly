import { describe, expect, it } from 'vitest';
import { parseChat } from '../../src/features/chat';
import { fixtures } from '../fixtures';

describe('parseChat — Android format', () => {
  it('parses messages and ignores system header', () => {
    const r = parseChat(fixtures.android);
    expect(r.messages.length).toBe(7);
  });

  it('extracts participants in insertion order', () => {
    const r = parseChat(fixtures.android);
    expect(r.participants).toEqual(['Alice', 'Bob']);
  });

  it('drops the end-to-end-encrypted system line', () => {
    const r = parseChat(fixtures.android);
    const allContent = r.messages.map((m) => m.originalString).join('\n');
    expect(allContent).not.toContain('end-to-end encrypted');
  });

  it('strips edited markers from content but flags message', () => {
    const r = parseChat(fixtures.android);
    const edited = r.messages.find((m) => m.edited);
    expect(edited).toBeDefined();
    expect(edited!.content).not.toMatch(/<This message was edited>/i);
    expect(edited!.content.trim()).toBe('Edited message goes here');
  });

  it('attaches valid Date objects to messages', () => {
    const r = parseChat(fixtures.android);
    expect(r.messages[0].date).toBeInstanceOf(Date);
    expect(r.messages[0].date?.getFullYear()).toBe(2024);
    expect(r.messages[0].date?.getMonth()).toBe(2); // March
    expect(r.messages[0].date?.getDate()).toBe(15);
  });
});

describe('parseChat — iOS format', () => {
  it('parses bracketed format', () => {
    const r = parseChat(fixtures.ios);
    expect(r.messages.length).toBe(5);
    expect(r.participants.sort()).toEqual(['Alice', 'Bob']);
  });

  it('preserves multi-line content', () => {
    const r = parseChat(fixtures.ios);
    const multiline = r.messages.find((m) =>
      m.content.includes('second line'),
    );
    expect(multiline).toBeDefined();
    expect(multiline!.content).toMatch(/second line/);
    expect(multiline!.content).toMatch(/third line/);
  });
});

describe('parseChat — Unicode names', () => {
  it('captures Cyrillic, CJK and accented Latin senders', () => {
    const r = parseChat(fixtures.unicode);
    expect(r.participants).toContain('Анна');
    expect(r.participants).toContain('Иван');
    expect(r.participants).toContain('田中');
    expect(r.participants).toContain('José');
  });
});

describe('parseChat — date validation', () => {
  it('returns null date for impossible day', () => {
    const text = '99/03/2024, 09:14 - Alice: text';
    const r = parseChat(text);
    expect(r.messages.length).toBe(1);
    expect(r.messages[0].date).toBeNull();
  });

  it('returns null date for impossible month', () => {
    const text = '15/13/2024, 09:14 - Alice: text';
    const r = parseChat(text);
    expect(r.messages[0].date).toBeNull();
  });

  it('rejects Feb 30 via roundtrip check', () => {
    const text = '30/02/2024, 09:14 - Alice: text';
    const r = parseChat(text);
    expect(r.messages[0].date).toBeNull();
  });
});

describe('parseChat — multi-line cap', () => {
  it('caps continuation lines at 100', () => {
    const lines: string[] = ['15/03/2024, 09:14 - Alice: start'];
    for (let i = 0; i < 200; i++) lines.push(`continuation ${i}`);
    const r = parseChat(lines.join('\n'));
    const contentLines = r.messages[0].content.split('\n').length;
    expect(contentLines).toBeLessThanOrEqual(101);
  });
});
