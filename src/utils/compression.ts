import pako from 'pako';

/**
 * Compress text using gzip compression
 * @param text - The text to compress
 * @returns Compressed data as Uint8Array
 */
export const compressText = (text: string): Uint8Array => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    return pako.gzip(data);
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress text');
  }
};

/**
 * Decompress gzip data back to text
 * @param data - The compressed data
 * @returns Decompressed text
 */
export const decompressText = (data: Uint8Array): string => {
  try {
    const decompressed = pako.ungzip(data);
    const decoder = new TextDecoder();
    return decoder.decode(decompressed);
  } catch (error) {
    console.error('Decompression error:', error);
    throw new Error('Failed to decompress data');
  }
};

/**
 * Convert Uint8Array to base64 string for storage
 */
export const uint8ArrayToBase64 = (data: Uint8Array): string => {
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
};

/**
 * Convert base64 string back to Uint8Array
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};
