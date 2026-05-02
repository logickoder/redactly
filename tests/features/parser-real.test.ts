import { describe, expect, it } from 'vitest';
import { parseChat } from '../../src/features/chat';
import realChat from '../fixtures/whatsapp-real.txt?raw';

describe('parseChat — real-world WhatsApp Android export', () => {
  it('parses without hanging', () => {
    const start = Date.now();
    const r = parseChat(realChat);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(r.messages.length).toBeGreaterThan(0);
  });

  it('drops the encryption notice system message', () => {
    const r = parseChat(realChat);
    const all = r.messages.map((m) => m.originalString).join('\n');
    expect(all).not.toContain('end-to-end encrypted');
  });

  it('extracts both senders', () => {
    const r = parseChat(realChat);
    expect(r.participants.sort()).toEqual(['alice', 'logickoder']);
  });

  it('handles double space between time and dash', () => {
    const text = '30/11/2022, 04:00 PM  - alice: hello';
    const r = parseChat(text);
    expect(r.messages.length).toBe(1);
    expect(r.messages[0].sender).toBe('alice');
    expect(r.messages[0].content).toBe('hello');
  });

  it('captures multi-line continuation under cap', () => {
    const r = parseChat(realChat);
    const examBooster = r.messages.find((m) =>
      m.content.includes('Exam Booster'),
    );
    expect(examBooster).toBeDefined();
    expect(examBooster!.content).toContain('Thales');
  });
});
