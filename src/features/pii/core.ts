import { emailDetector, phoneDetector, urlDetector } from './detectors';
import type { PiiSettings } from './types';

export const applyPii = (text: string, settings: PiiSettings): string => {
  // Order: email → url → phone. Email + URL contain digits that would otherwise be
  // matched by the looser phone pattern, so they must run first.
  if (settings.email) {
    text = text.replace(emailDetector.pattern, emailDetector.replacement);
  }
  if (settings.url) {
    text = text.replace(urlDetector.pattern, urlDetector.replacement);
  }
  if (settings.phone) {
    text = text.replace(phoneDetector.pattern, phoneDetector.replacement);
  }
  return text;
};

export const isPiiEnabled = (settings: PiiSettings): boolean =>
  settings.email || settings.url || settings.phone;
