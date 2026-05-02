import pako from 'pako';

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
