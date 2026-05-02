import type { Message, ParseResult } from './types';

const DATE = String.raw`(\d{1,2}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?)`;
const TIME = String.raw`(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)`;

const IOS_MESSAGE = new RegExp(
  `^\\s*\\[${DATE},?\\s*${TIME}\\]\\s*([^:]+?):\\s(.*)$`,
);
const IOS_HEADER = new RegExp(
  `^\\s*\\[${DATE},?\\s*${TIME}\\]\\s*(.+)$`,
);
const ANDROID_MESSAGE = new RegExp(
  `^\\s*${DATE},?\\s*${TIME}\\s+-\\s+([^:]+?):\\s(.*)$`,
);
const ANDROID_HEADER = new RegExp(
  `^\\s*${DATE},?\\s*${TIME}\\s+-\\s+(.+)$`,
);

const EDITED_MARKER = /\s*<This message was edited>\s*$/i;
const MAX_CONTINUATION_LINES = 100;

interface MatchedHeader {
  dateStr: string;
  timeStr: string;
  sender: string;
  content: string;
}

const matchMessageHeader = (line: string): MatchedHeader | null => {
  const m = IOS_MESSAGE.exec(line) ?? ANDROID_MESSAGE.exec(line);
  if (!m) return null;
  return {
    dateStr: m[1],
    timeStr: m[2],
    sender: m[3].trim(),
    content: m[4],
  };
};

const isSystemHeader = (line: string): boolean =>
  IOS_HEADER.test(line) || ANDROID_HEADER.test(line);

const stripEdited = (
  content: string,
): { content: string; edited: boolean } => {
  if (EDITED_MARKER.test(content)) {
    return { content: content.replace(EDITED_MARKER, ''), edited: true };
  }
  return { content, edited: false };
};

export const parseChat = (
  text: string,
  dateFormat: string = 'dd/MM/yyyy',
): ParseResult => {
  const lines = text.split('\n');
  const messages: Message[] = [];
  const participants = new Set<string>();

  let currentMessage: Message | null = null;
  let continuationCount = 0;

  const finalize = () => {
    if (!currentMessage) return;
    const { content, edited } = stripEdited(currentMessage.content);
    currentMessage.content = content;
    if (edited) currentMessage.edited = true;
    messages.push(currentMessage);
    currentMessage = null;
    continuationCount = 0;
  };

  lines.forEach((line, index) => {
    const header = matchMessageHeader(line);
    if (header) {
      finalize();
      const date = parseDate(header.dateStr, header.timeStr, dateFormat);
      participants.add(header.sender);
      currentMessage = {
        id: `msg-${index}`,
        date,
        sender: header.sender,
        content: header.content,
        originalString: line,
      };
      return;
    }

    if (isSystemHeader(line)) {
      finalize();
      return;
    }

    if (currentMessage && continuationCount < MAX_CONTINUATION_LINES) {
      currentMessage.content += '\n' + line;
      currentMessage.originalString += '\n' + line;
      continuationCount++;
    }
  });

  finalize();

  return {
    messages,
    participants: Array.from(participants),
  };
};

const parseDate = (
  dateStr: string,
  timeStr: string,
  format: string,
): Date | null => {
  try {
    const cleanDate = dateStr.replace(/[[\]]/g, '');
    const cleanTime = timeStr.replace(/[[\]]/g, '');

    const parts = cleanDate.split(/[/.-]/);
    const formatParts = format.split(/[/.-]/);

    let day = 0;
    let month = 0;
    let year = new Date().getFullYear();

    const partsToUse = Math.min(parts.length, formatParts.length);

    for (let i = 0; i < partsToUse; i++) {
      const part = formatParts[i];
      const val = parseInt(parts[i], 10);
      if (Number.isNaN(val)) return null;
      if (part.includes('d')) day = val;
      if (part.includes('M')) month = val - 1;
      if (part.includes('y')) {
        year = val;
        if (year < 100) year += 2000;
      }
    }

    if (day < 1 || day > 31) return null;
    if (month < 0 || month > 11) return null;

    const date = new Date(year, month, day);

    const timeMatch = cleanTime.match(
      /(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?([AP]M))?/i,
    );
    if (timeMatch) {
      const [, h, m, s, ampStr] = timeMatch;
      let hours = parseInt(h, 10);
      const minutes = parseInt(m, 10);
      const seconds = s ? parseInt(s, 10) : 0;

      if (ampStr) {
        const amp = ampStr.toUpperCase();
        if (amp === 'PM' && hours < 12) hours += 12;
        if (amp === 'AM' && hours === 12) hours = 0;
      }

      if (hours > 23 || minutes > 59 || seconds > 59) return null;

      date.setHours(hours, minutes, seconds);
    }

    if (isNaN(date.getTime())) return null;
    if (date.getMonth() !== month || date.getDate() !== day) return null;

    return date;
  } catch (e) {
    console.error('Date parsing error:', e);
    return null;
  }
};
