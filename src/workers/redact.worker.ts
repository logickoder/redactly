/// <reference lib="webworker" />

// Direct sub-module imports (bypassing the feature barrel) so the worker bundle
// stays minimal — no IndexedDB / pako / storage code shipped in the worker.
import { parseChat } from '../features/chat/parser';
import type { Message, ParseResult } from '../features/chat/types';
import { redactMessages } from '../features/redaction/core';
import type { RedactionSettings } from '../features/redaction/types';

export type WorkerRequest =
  | { id: number; type: 'parse'; text: string; dateFormat: string }
  | {
      id: number;
      type: 'redact';
      messages: Message[];
      settings: RedactionSettings;
    };

export type WorkerResponse =
  | { id: number; type: 'parse'; result: ParseResult }
  | { id: number; type: 'redact'; result: string }
  | { id: number; type: 'error'; error: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === 'parse') {
      const result = parseChat(req.text, req.dateFormat);
      const response: WorkerResponse = { id: req.id, type: 'parse', result };
      ctx.postMessage(response);
      return;
    }

    if (req.type === 'redact') {
      const result = redactMessages(req.messages, req.settings);
      const response: WorkerResponse = { id: req.id, type: 'redact', result };
      ctx.postMessage(response);
      return;
    }
  } catch (err) {
    const response: WorkerResponse = {
      id: req.id,
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
  }
};
