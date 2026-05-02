import type { Message } from '../chat';
import { escapeRegex } from '../../lib/regex';
import type { RedactionSettings } from './types';

interface CompiledRules {
  regex: RegExp | null;
  lookup: Map<string, string>;
}

const MIN_AGGRESSIVE_PART_LENGTH = 3;

const compileRules = (
  aliases: Record<string, string>,
  aggressive: boolean,
): CompiledRules => {
  const collected: Array<[string, string]> = [];

  for (const [name, alias] of Object.entries(aliases)) {
    const trimmedName = name.trim();
    const trimmedAlias = alias?.trim();
    if (!trimmedName || !trimmedAlias) continue;

    collected.push([trimmedName, trimmedAlias]);

    if (aggressive) {
      for (const part of trimmedName.split(/\s+/)) {
        if (part.length >= MIN_AGGRESSIVE_PART_LENGTH) {
          collected.push([part, trimmedAlias]);
        }
      }
    }
  }

  const lookup = new Map<string, string>();
  for (const [pattern, alias] of collected) {
    const key = pattern.toLowerCase();
    if (!lookup.has(key)) lookup.set(key, alias);
  }

  if (lookup.size === 0) return { regex: null, lookup };

  const sorted = [...lookup.keys()].sort((a, b) => b.length - a.length);
  const alternation = sorted.map(escapeRegex).join('|');

  const regex = new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${alternation})(?![\\p{L}\\p{N}_])`,
    'giu',
  );

  return { regex, lookup };
};

const filterByDate = (
  messages: Message[],
  startDate?: string,
  endDate?: string,
): Message[] => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  return messages.filter((msg) => {
    if (!msg.date) return true;
    if (start && msg.date < start) return false;
    return !(end && msg.date > end);
  });
};

export const redactMessages = (
  messages: Message[],
  settings: RedactionSettings,
): string => {
  if (messages.length === 0) return '';

  const filtered = filterByDate(messages, settings.startDate, settings.endDate);
  const { regex, lookup } = compileRules(
    settings.aliases,
    settings.aggressiveRedaction,
  );

  if (!regex) return filtered.map((m) => m.originalString).join('\n');

  const apply = (line: string): string =>
    line.replace(regex, (match) => lookup.get(match.toLowerCase()) ?? match);

  return filtered.map((msg) => apply(msg.originalString)).join('\n');
};
