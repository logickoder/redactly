import { useEffect, useRef } from 'react';
import RedactWorker from '../workers/redact.worker.ts?worker';
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

export const useRedactWorker = (): RedactWorkerApi => {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef(
    new Map<number, (resp: WorkerResponse) => void>(),
  );
  const idRef = useRef(0);

  useEffect(() => {
    if (!supportsWorker()) return;

    const worker = new RedactWorker();
    const callbacks = callbacksRef.current;
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const cb = callbacks.get(e.data.id);
      if (cb) {
        cb(e.data);
        callbacks.delete(e.data.id);
      }
    };
    worker.onerror = (err) => {
      console.error('Redact worker error:', err);
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
      callbacks.clear();
    };
  }, []);

  type Payload = DistributiveOmit<WorkerRequest, 'id'>;

  const send = <T>(payload: Payload): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error('Worker not available'));
        return;
      }
      const id = ++idRef.current;
      callbacksRef.current.set(id, (resp) => {
        if (resp.type === 'error') {
          reject(new Error(resp.error));
        } else {
          resolve(resp.result as T);
        }
      });
      worker.postMessage({ ...payload, id } as WorkerRequest);
    });

  return {
    parse: async (text, dateFormat) => {
      if (workerRef.current) {
        return send<ParseResult>({ type: 'parse', text, dateFormat });
      }
      // Fallback: synchronous on the main thread.
      return parseChat(text, dateFormat);
    },
    redact: async (messages, settings) => {
      if (workerRef.current) {
        return send<string>({ type: 'redact', messages, settings });
      }
      return redactMessages(messages, settings);
    },
  };
};
