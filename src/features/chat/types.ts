export interface Message {
  id: string;
  date: Date | null;
  sender: string;
  content: string;
  originalString: string;
  edited?: boolean;
}

export interface ParseResult {
  messages: Message[];
  participants: string[];
}

export interface SavedChat {
  id: string;
  title: string;
  date: string;
  content: string;
  originalContent?: string;
}

export interface ChatPreview {
  id: string;
  title: string;
  date: string;
  preview: string;
}

export interface StoredChat {
  id: string;
  title: string;
  date: string;
  preview: string;
  content: string;
  originalContent?: string;
  compressed: boolean;
}
