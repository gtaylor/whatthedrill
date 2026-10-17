// Inline stroke icons on a 24×24 grid. Paths inherit `currentColor` unless
// they set their own stroke, so an icon takes the color of its context.
export const ICONS = {
  bat: '<path d="M3 21L14 10" stroke-width="3.2"/><circle cx="18" cy="6" r="3"/>',
  power: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  grounder: '<path d="M2 21h20"/><path d="M2 9Q5 21 8 15Q11 21 14 17"/><circle cx="18" cy="18" r="2.5"/>',
  flyball: '<path d="M3 21Q12 1 21 21" stroke-dasharray="2 3"/><circle cx="12" cy="10.5" r="2.5"/>',
  mask: '<path d="M6 4h12v9a6 6 0 0 1-12 0z"/><path d="M6 8h12M6 12h12M12 4v15"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  zone: '<rect x="6" y="3" width="12" height="16" rx="1"/><path d="M6 8.3h12M6 13.6h12M10 3v16M14 3v16"/>',
  arm: '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>',
  diamond: '<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 21l-4.5-4.5" stroke="#C62A3B" stroke-width="2.6"/>',
  speed: '<path d="M3 7h9M1 12h11M3 17h9"/><path d="M15 6l6 6-6 6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 14c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  bag: '<path d="M4 8h16v12H4z"/><path d="M9 8V5h6v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as [IconName, ...IconName[]];
