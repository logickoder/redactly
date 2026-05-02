import { useEffect, useRef } from 'react';
import RedactWorker from '../workers/redact.worker?worker';
import type {
  WorkerRequest,
  WorkerResponse,
} from '../workers/redact.worker';
import type { Message, ParseResult } from '../features/chat';
import type { RedactionSettings } from '../features/redaction';
import { parseChat } from '../features/chat';
import { redactMessages } from '../features/redaction';

interface RedactWorkerApi {
  parse: (text: string, dateFormat: string) => Promise<ParseResult>;
  redact: (
    messages: Message[],
    settings: RedactionSettings,
  ) => Promise<string>;
}

// Built-in `Omit` does not distribute over discriminated unions, which collapses
// the variant-specific fields. This helper preserves them.
type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

const supportsWorker = (): boolean =>
  typeof Worker !== 'undefined' && typeof window !== 'undefined';

// Module-level singleton: avoids React StrictMode's mount/unmount/remount cycle
// terminating the worker mid-init in dev. The worker lives for the page's lifetime.
let sharedWorker: Worker | null | undefined;
const sharedCallbacks = new Map<number, (resp: WorkerResponse) => void>();
let sharedIdCounter = 0;

const getWorker = (): Worker | null => {
  if (sharedWorker !== undefined) return sharedWorker;
  if (!supportsWorker()) {
    sharedWorker = null;
    return null;
  }
  try {
    const w = new RedactWorker();
    console.debug('[redact-worker] constructed');
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const cb = sharedCallbacks.get(e.data.id);
      if (cb) {
        sharedCallbacks.delete(e.data.id);
        cb(e.data);
      }
    };
    w.onerror = (err) => {
      console.error(
        'Redact worker runtime error:',
        err.message || err,
        err.filename ? `${err.filename}:${err.lineno}:${err.colno}` : '',
      );
      const pending = Array.from(sharedCallbacks.entries());
      sharedCallbacks.clear();
      for (const [, cb] of pending) {
        cb({
          id: -1,
          type: 'error',
          error: err.message || 'Worker crashed',
        });
      }
    };
    w.onmessageerror = (e) => {
      console.error('Redact worker message error:', e);
    };
    sharedWorker = w;
    return w;
  } catch (err) {
    console.warn(
      'Redact worker failed to construct; falling back to main thread.',
      err,
    );
    sharedWorker = null;
    return null;
  }
};

export const useRedactWorker = (): RedactWorkerApi => {
  const apiRef = useRef<RedactWorkerApi | null>(null);

  if (apiRef.current === null) {
    const send = <T>(payload: DistributiveOmit<WorkerRequest, 'id'>): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const worker = getWorker();
        if (!worker) {
          reject(new Error('Worker not available'));
          return;
        }
        const id = ++sharedIdCounter;

        const timeout = setTimeout(() => {
          if (sharedCallbacks.delete(id)) {
            reject(new Error('Worker request timed out (30s)'));
          }
        }, 30_000);

        sharedCallbacks.set(id, (resp) => {
          clearTimeout(timeout);
          if (resp.type === 'error') {
            reject(new Error(resp.error));
          } else {
            resolve(resp.result as T);
          }
        });
        console.debug('[redact-worker] →', payload.type, 'id=', id);
        worker.postMessage({ ...payload, id } as WorkerRequest);
      });

    apiRef.current = {
      parse: async (text, dateFormat) => {
        if (getWorker()) {
          return send<ParseResult>({ type: 'parse', text, dateFormat });
        }
        return parseChat(text, dateFormat);
      },
      redact: async (messages, settings) => {
        if (getWorker()) {
          return send<string>({ type: 'redact', messages, settings });
        }
        return redactMessages(messages, settings);
      },
    };
  }

  // Touch the worker once on mount so it boots in parallel with first user input.
  useEffect(() => {
    getWorker();
  }, []);

  return apiRef.current;
};
