import type { NsfwSettings } from '../nsfw';
import type { PiiSettings } from '../pii';

export interface RedactionSettings {
  aliases: Record<string, string>;
  aggressiveRedaction: boolean;
  startDate?: string;
  endDate?: string;
  pii?: PiiSettings;
  nsfw?: NsfwSettings;
}
