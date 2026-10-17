// "How are you practicing?" chips. Shared by the pages (server-side) and the
// filter script (client-side) so both agree on what each chip matches.

export const PRACTICE_OPTIONS = [
  { id: 'any', label: 'Any way' },
  { id: 'solo', label: 'Alone' },
  { id: 'partner', label: 'With a partner' },
  { id: 'team', label: 'Team practice' },
  { id: 'indoors', label: 'Indoors' },
  { id: 'quick', label: '10 min or less' },
] as const;

export type PracticeId = (typeof PRACTICE_OPTIONS)[number]['id'];

export interface PracticeFacts {
  format: string;
  space: string;
  minutes: number;
}

export function isPracticeId(value: unknown): value is PracticeId {
  return PRACTICE_OPTIONS.some((o) => o.id === value);
}

export function matchesPractice(practice: PracticeId, drill: PracticeFacts): boolean {
  switch (practice) {
    case 'any':
      return true;
    case 'solo':
      return drill.format === 'solo';
    case 'partner':
      return drill.format === 'partner';
    case 'team':
      return drill.format === 'small-group' || drill.format === 'team';
    case 'indoors':
      return drill.space === 'indoor' || drill.space === 'backyard';
    case 'quick':
      return drill.minutes <= 10;
  }
}
