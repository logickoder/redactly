import type { NsfwTier } from './types';
import { ldnoobwEnglish } from './wordlist.generated';

// Tier 'slurs' is base64-encoded so contributors browsing source aren't gratuitously
// exposed. Curated subset; users can extend via extraWords.
const SLURS_BASE64 = [
  'bmlnZ2Vy',
  'bmlnZ2E=',
  'ZmFnZ290',
  'ZmFn',
  'ZHlrZQ==',
  'dHJhbm55',
  'cmV0YXJk',
  'cmV0YXJkZWQ=',
  'Y2hpbms=',
  'c3BpYw==',
  'a2lrZQ==',
];

const decodeSlurs = (): string[] =>
  SLURS_BASE64.map((b64) => atob(b64).toLowerCase());

// LDNOOBW conflates profanity + sexual + some slurs. We strip the slur subset out
// of the general tier so toggling slurs gates the right matches.
const slurSet = new Set(decodeSlurs());
const generalFromLdnoobw = ldnoobwEnglish.filter((w) => !slurSet.has(w));

const violenceCurated: string[] = [
  'kill',
  'kills',
  'killed',
  'killing',
  'murder',
  'murdered',
  'murdering',
  'murderer',
  'rape',
  'raped',
  'raping',
  'rapist',
  'stab',
  'stabbed',
  'stabbing',
  'behead',
  'beheaded',
  'beheading',
  'slaughter',
  'slaughtered',
  'decapitate',
  'decapitated',
  'lynch',
  'lynched',
  'lynching',
  'massacre',
  'massacred',
  'torture',
  'tortured',
  'torturing',
  'execute',
  'executed',
  'execution',
];

export const wordlist: Record<NsfwTier, string[]> = {
  general: generalFromLdnoobw,
  slurs: decodeSlurs(),
  violence: violenceCurated,
};
