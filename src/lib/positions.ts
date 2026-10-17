export const POSITIONS = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'] as const;
export const POSITION_GROUPS = ['all', 'infield', 'outfield'] as const;

export const POSITION_NAMES: Record<(typeof POSITIONS)[number], string> = {
  P: 'Pitcher',
  C: 'Catcher',
  '1B': 'First base',
  '2B': 'Second base',
  SS: 'Shortstop',
  '3B': 'Third base',
  LF: 'Left field',
  CF: 'Center field',
  RF: 'Right field',
};
