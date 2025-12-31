export interface Message {
  id: string;
  date: Date | null;
  sender: string;
  content: string;
  originalString: string;
}

export interface ParseResult {
  messages: Message[];
  participants: string[];
}

const CHAT_REGEX =
  /^\s*\[?(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)]?(?:\s*-\s*|\s+)(.*?):\s(.*)/;

export const parseChat = (text: string, dateFormat: string = 'dd/MM/yyyy'): ParseResult => {
  const lines = text.split('\n');
  const messages: Message[] = [];
  const participants = new Set<string>();

  let currentMessage: Message | null = null;

  lines.forEach((line, index) => {
    const match = line.match(CHAT_REGEX);

    if (match) {
      // If we have a previous message, push it
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, dateStr, timeStr, sender, content] = match;

      // Basic date parsing - this can be tricky with different locales
      // We'll try to construct a date object, but keep it robust
      const date = parseDate(dateStr, timeStr, dateFormat);

      participants.add(sender);

      currentMessage = {
        id: `msg-${index}`,
        date,
        sender,
        content,
        originalString: line
      };
    } else {
      console.log('Line:', line);
      console.log('Match:', match);
      // If it's a continuation of the previous message
      if (currentMessage) {
        currentMessage.content += '\n' + line;
        currentMessage.originalString += '\n' + line;
      }
    }
  });

  // Push the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return {
    messages,
    participants: Array.from(participants)
  };
};

const parseDate = (dateStr: string, timeStr: string, format: string): Date | null => {
  try {
    // Remove brackets and other noise if needed
    const cleanDate = dateStr.replace(/[[\]]/g, '');
    const cleanTime = timeStr.replace(/[[\]]/g, '');

    // Simple format parser
    // Supported tokens: dd, MM, yyyy, yy
    // Separators: / . -

    const parts = cleanDate.split(/[/.-]/);
    // if (parts.length !== 3) return null;

    const formatParts = format.split(/[/.-]/);
    // if (formatParts.length !== 3) return null;

    let day = 0;
    let month = 0;
    let year = new Date().getFullYear(); // Default to current year

    const partsToUse = Math.min(parts.length, formatParts.length);

    for (let i = 0; i < partsToUse; i++) {
      const part = formatParts[i];
      const val = parseInt(parts[i], 10);
      if (part.includes('d')) day = val;
      if (part.includes('M')) month = val - 1; // Month is 0-indexed in JS Date
      if (part.includes('y')) {
        year = val;
        if (year < 100) year += 2000; // Assume 20xx for 2-digit years
      }
    }

    // Parse time
    // Assume HH:MM or HH:MM:SS or HH:MM AM/PM
    // This is a bit complex to do manually perfectly, but let's try standard Date parsing for time
    // combined with our parsed date.

    // Construct a standard ISO-like string or use Date constructor
    const date = new Date(year, month, day);

    // Now add time
    // cleanTime format: 12:30 or 12:30 PM or 12:30:45
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?([AP]M))?/i);
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

      date.setHours(hours, minutes, seconds);
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (e) {
    console.error('Date parsing error:', e);
    return null;
  }
};
