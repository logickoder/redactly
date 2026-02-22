import { deleteDB, type IDBPDatabase, openDB } from 'idb';
import {
  base64ToUint8Array,
  compressText,
  decompressText,
  uint8ArrayToBase64,
} from './compression';

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

const DB_NAME = 'redactly-db';
const DB_VERSION = 3; // Increment version for preview field
const CHATS_STORE = 'chats';

interface StoredChat {
  id: string;
  title: string;
  date: string;
  preview: string; // First 10 lines, uncompressed for fast loading
  content: string; // Compressed base64
  originalContent?: string; // Compressed base64
  compressed: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = async (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${DB_VERSION}`,
        );

        // Create chats store if it doesn't exist
        if (!db.objectStoreNames.contains(CHATS_STORE)) {
          console.log('Creating chats object store...');
          const store = db.createObjectStore(CHATS_STORE, { keyPath: 'id' });
          store.createIndex('date', 'date');
          console.log('Chats object store created successfully');
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Initialize the database (call this on app startup)
 */
export const initDB = async (): Promise<void> => {
  try {
    await getDB();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    throw error;
  }
};

/**
 * Clear and reinitialize the database (useful for debugging)
 */
export const resetDB = async (): Promise<void> => {
  try {
    // Close existing connection
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    }

    // Delete the database
    await deleteDB(DB_NAME);
    console.log('Database deleted');

    // Reinitialize
    await initDB();
    console.log('Database reinitialized');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

/**
 * Extract preview (first 10 lines) from content
 */
const extractPreview = (content: string): string => {
  const lines = content.split('\n');
  const previewLines = lines.slice(0, 10);
  return previewLines.join('\n');
};

/**
 * Save a chat to IndexedDB (each chat as a separate record)
 */
export const saveChat = async (chat: SavedChat): Promise<void> => {
  const db = await getDB();

  // Extract preview (first 10 lines, uncompressed)
  const preview = extractPreview(chat.content);

  // Compress content if larger than 10KB
  const shouldCompress = chat.content.length > 10 * 1024;

  const storedChat: StoredChat = {
    id: chat.id,
    title: chat.title,
    date: chat.date,
    preview, // Store uncompressed for fast loading
    content: shouldCompress
      ? uint8ArrayToBase64(compressText(chat.content))
      : chat.content,
    originalContent:
      chat.originalContent && chat.originalContent.length > 10 * 1024
        ? uint8ArrayToBase64(compressText(chat.originalContent))
        : chat.originalContent,
    compressed: shouldCompress,
  };

  await db.put(CHATS_STORE, storedChat);
};

/**
 * Get a single chat by ID
 */
export const getChat = async (id: string): Promise<SavedChat | null> => {
  const db = await getDB();
  const storedChat = await db.get(CHATS_STORE, id);

  if (!storedChat) return null;

  // Decompress if needed
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

/**
 * Get all chat previews (fast - no decompression needed)
 * Returns only: id, title, date, preview
 */
export const getAllChatPreviews = async (): Promise<
  Array<{
    id: string;
    title: string;
    date: string;
    preview: string;
  }>
> => {
  const db = await getDB();
  const storedChats = await db.getAllFromIndex(CHATS_STORE, 'date');

  // Map to preview objects (no decompression!)
  const previews = storedChats.map((storedChat: StoredChat) => ({
    id: storedChat.id,
    title: storedChat.title,
    date: storedChat.date,
    preview:
      storedChat.preview ||
      extractPreview(
        storedChat.compressed
          ? decompressText(base64ToUint8Array(storedChat.content))
          : storedChat.content,
      ), // Fallback for old chats without preview
  }));

  // Sort by date descending (newest first)
  return previews.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

/**
 * Load full chat content by ID (on-demand)
 */
export const loadFullChat = async (id: string): Promise<SavedChat | null> => {
  return await getChat(id);
};

/**
 * Delete a chat by ID
 */
export const deleteChat = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete(CHATS_STORE, id);
};
