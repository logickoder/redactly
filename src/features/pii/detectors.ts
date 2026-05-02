export interface Detector {
  pattern: RegExp;
  replacement: string;
}

export const emailDetector: Detector = {
  pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  replacement: '[EMAIL]',
};

export const urlDetector: Detector = {
  pattern: /\bhttps?:\/\/[^\s<>"']+/gi,
  replacement: '[LINK]',
};

export const phoneDetector: Detector = {
  pattern: /\+?\d[\d\s\-().]{7,}\d/g,
  replacement: '[PHONE]',
};
