export interface RedactionSettings {
  aliases: Record<string, string>;
  aggressiveRedaction: boolean;
  startDate?: string;
  endDate?: string;
}
