import { deleteDB, type IDBPDatabase, openDB } from 'idb';
import {
  base64ToUint8Array,
  compressText,
  decompressText,
  uint8ArrayToBase64,
} from '../compression';
import type { ChatPreview, SavedChat, StoredChat } from './types';

const DB_NAME = 'redactly-db';
const DB_VERSION = 3;
const CHATS_STORE = 'chats';
const COMPRESSION_THRESHOLD = 10 * 1024;
const PREVIEW_LINE_COUNT = 10;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = async (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CHATS_STORE)) {
          const store = db.createObjectStore(CHATS_STORE, { keyPath: 'id' });
          store.createIndex('date', 'date');
        }
      },
    });
  }
  return dbPromise;
};

export const initDB = async (): Promise<void> => {
  try {
    await getDB();
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    throw error;
  }
};

export const resetDB = async (): Promise<void> => {
  try {
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    }
    await deleteDB(DB_NAME);
    await initDB();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

const extractPreview = (content: string): string => {
  const lines = content.split('\n');
  const previewLines = lines.slice(0, PREVIEW_LINE_COUNT);
  return previewLines.join('\n');
};

export const saveChat = async (chat: SavedChat): Promise<void> => {
  const db = await getDB();

  const preview = extractPreview(chat.content);
  const shouldCompress = chat.content.length > COMPRESSION_THRESHOLD;

  const storedChat: StoredChat = {
    id: chat.id,
    title: chat.title,
    date: chat.date,
    preview,
    content: shouldCompress
      ? uint8ArrayToBase64(compressText(chat.content))
      : chat.content,
    originalContent:
      chat.originalContent && chat.originalContent.length > COMPRESSION_THRESHOLD
        ? uint8ArrayToBase64(compressText(chat.originalContent))
        : chat.originalContent,
    compressed: shouldCompress,
  };

  await db.put(CHATS_STORE, storedChat);
};

export const getChat = async (id: string): Promise<SavedChat | null> => {
  const db = await getDB();
  const storedChat = await db.get(CHATS_STORE, id);

  if (!storedChat) return null;

  return {
    id: storedChat.id,
    title: storedChat.title,
    date: storedChat.date,
    content: storedChat.compressed
      ? decompressText(base64ToUint8Array(storedChat.content))
      : storedChat.content,
    originalContent: storedChat.originalContent
      ? storedChat.compressed
        ? decompressText(base64ToUint8Array(storedChat.originalContent))
        : storedChat.originalContent
      : undefined,
  };
};

export const getAllChatPreviews = async (): Promise<ChatPreview[]> => {
  const db = await getDB();
  const storedChats = await db.getAllFromIndex(CHATS_STORE, 'date');

  const previews: ChatPreview[] = [];
  const backfillTargets: StoredChat[] = [];

  for (const storedChat of storedChats as StoredChat[]) {
    let preview = storedChat.preview;
    if (!preview) {
      preview = extractPreview(
        storedChat.compressed
          ? decompressText(base64ToUint8Array(storedChat.content))
          : storedChat.content,
      );
      backfillTargets.push({ ...storedChat, preview });
    }
    previews.push({
      id: storedChat.id,
      title: storedChat.title,
      date: storedChat.date,
      preview,
    });
  }

  if (backfillTargets.length > 0) {
    const tx = db.transaction(CHATS_STORE, 'readwrite');
    await Promise.all([
      ...backfillTargets.map((c) => tx.store.put(c)),
      tx.done,
    ]);
  }

  return previews.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

export const loadFullChat = async (id: string): Promise<SavedChat | null> => {
  return await getChat(id);
};

export const deleteChat = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete(CHATS_STORE, id);
};
