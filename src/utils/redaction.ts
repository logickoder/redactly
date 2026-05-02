import type { Message } from './chatParser';
import { escapeRegex } from './regex';

export interface RedactionSettings {
  aliases: Record<string, string>;
  aggressiveRedaction: boolean;
  startDate?: string;
  endDate?: string;
}

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

const redactLine = (
  line: string,
  aliases: Record<string, string>,
  aggressive: boolean,
): string => {
  Object.entries(aliases).forEach(([name, aliasName]) => {
    const escaped = escapeRegex(name);
    line = line.replace(new RegExp(escaped, 'gi'), aliasName);
    if (aggressive) {
      name
        .split(/\s+/)
        .filter((p) => p.length > 2)
        .forEach((part) => {
          const escapedPart = escapeRegex(part);
          line = line.replace(
            new RegExp(`\\b${escapedPart}\\b`, 'gi'),
            aliasName,
          );
        });
    }
  });
  return line;
};

export const redactMessages = (
  messages: Message[],
  settings: RedactionSettings,
): string => {
  if (messages.length === 0) return '';

  const filtered = filterByDate(messages, settings.startDate, settings.endDate);

  return filtered
    .map((msg) =>
      redactLine(msg.originalString, settings.aliases, settings.aggressiveRedaction),
    )
    .join('\n');
};
