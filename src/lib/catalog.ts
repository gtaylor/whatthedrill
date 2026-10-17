import { getCollection, type CollectionEntry } from 'astro:content';
import { POSITIONS } from './positions';

/**
 * An area only appears on the site once it has this many drills, so
 * half-empty pages never go live.
 */
export const MIN_DRILLS_PER_AREA = 5;

/** Top-level routes that a category id must not collide with. */
const RESERVED_SLUGS = new Set(['drills', 'about', '404']);

export type Category = CollectionEntry<'categories'>;
export type Area = CollectionEntry<'areas'>;
export type Focus = CollectionEntry<'focuses'>;
export type Drill = CollectionEntry<'drills'>;

export interface Catalog {
  categories: Category[];
  areas: Area[];
  focuses: Focus[];
  drills: Drill[];
  category(id: string): Category;
  area(id: string): Area;
  focus(id: string): Focus;
  drill(id: string): Drill;
  /** Drills tagged with any focus in the area, alphabetical. */
  drillsInArea(areaId: string): Drill[];
  drillsInCategory(categoryId: string): Drill[];
  /** Areas a drill rolls up to, in focus order. */
  areasOf(drill: Drill): Area[];
  isAreaLive(areaId: string): boolean;
  liveAreas(categoryId: string): Area[];
  /** Live, non-banner categories for the home page tiles and the main nav. */
  tileCategories: Category[];
  /** Live banner category ("Just starting out"), if any. */
  bannerCategory: Category | undefined;
}

let cached: Promise<Catalog> | undefined;

export function getCatalog(): Promise<Catalog> {
  cached ??= buildCatalog();
  return cached;
}

const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) => a.data.order - b.data.order;

async function buildCatalog(): Promise<Catalog> {
  const [categories, areas, focuses, drills] = await Promise.all([
    getCollection('categories'),
    getCollection('areas'),
    getCollection('focuses'),
    getCollection('drills'),
  ]);
  categories.sort(byOrder);
  const categoryOrder = new Map(categories.map((c) => [c.id, c.data.order]));
  areas.sort((a, b) => (categoryOrder.get(a.data.category.id) ?? 0) - (categoryOrder.get(b.data.category.id) ?? 0) || byOrder(a, b));
  drills.sort((a, b) => a.data.title.localeCompare(b.data.title));

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const focusById = new Map(focuses.map((f) => [f.id, f]));
  const drillById = new Map(drills.map((d) => [d.id, d]));

  validate({ categories, areas, focuses, drills, categoryById, areaById, focusById, drillById });

  const areasOf = (drill: Drill): Area[] => {
    const ids = new Set(drill.data.focuses.flatMap((f) => focusById.get(f.id)!.data.areas.map((a) => a.id)));
    return areas.filter((a) => ids.has(a.id));
  };

  const drillsByArea = new Map<string, Drill[]>(areas.map((a) => [a.id, []]));
  for (const drill of drills) {
    for (const area of areasOf(drill)) drillsByArea.get(area.id)!.push(drill);
  }

  const isAreaLive = (areaId: string) => (drillsByArea.get(areaId)?.length ?? 0) >= MIN_DRILLS_PER_AREA;
  const liveAreas = (categoryId: string) => areas.filter((a) => a.data.category.id === categoryId && isAreaLive(a.id));
  const liveCategories = categories.filter((c) => liveAreas(c.id).length > 0);

  const get = <T>(map: Map<string, T>, kind: string) => (id: string) => {
    const value = map.get(id);
    if (!value) throw new Error(`Unknown ${kind} "${id}"`);
    return value;
  };

  const catalog: Catalog = {
    categories,
    areas,
    focuses,
    drills,
    category: get(categoryById, 'category'),
    area: get(areaById, 'area'),
    focus: get(focusById, 'focus'),
    drill: get(drillById, 'drill'),
    drillsInArea: (id) => drillsByArea.get(id) ?? [],
    drillsInCategory: (id) => drills.filter((d) => areasOf(d).some((a) => a.data.category.id === id)),
    areasOf,
    isAreaLive,
    liveAreas,
    tileCategories: liveCategories.filter((c) => !c.data.banner),
    bannerCategory: liveCategories.find((c) => c.data.banner),
  };

  printCoverage(catalog);
  return catalog;
}

interface ValidationInput {
  categories: Category[];
  areas: Area[];
  focuses: Focus[];
  drills: Drill[];
  categoryById: Map<string, Category>;
  areaById: Map<string, Area>;
  focusById: Map<string, Focus>;
  drillById: Map<string, Drill>;
}

/** Cross-checks references between collections. Any problem fails the build. */
function validate({ categories, areas, focuses, drills, categoryById, areaById, focusById, drillById }: ValidationInput) {
  const problems: string[] = [];

  for (const c of categories) {
    if (RESERVED_SLUGS.has(c.id)) problems.push(`category "${c.id}" collides with a built-in page`);
  }
  for (const a of areas) {
    if (!categoryById.has(a.data.category.id)) problems.push(`area "${a.id}" names unknown category "${a.data.category.id}"`);
  }
  for (const f of focuses) {
    for (const a of f.data.areas) {
      if (!areaById.has(a.id)) problems.push(`focus "${f.id}" names unknown area "${a.id}"`);
    }
  }
  for (const d of drills) {
    for (const f of d.data.focuses) {
      if (!focusById.has(f.id)) problems.push(`drill "${d.id}" names unknown focus "${f.id}"`);
    }
    for (const r of d.data.related) {
      if (r.id === d.id) problems.push(`drill "${d.id}" lists itself as related`);
      else if (!drillById.has(r.id)) problems.push(`drill "${d.id}" names unknown related drill "${r.id}"`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Content has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
  }
}

function printCoverage(catalog: Catalog) {
  const lines = ['', 'WhatTheDrill coverage (area: drills, solo/partner/team, empty focuses)'];
  for (const area of catalog.areas) {
    const drills = catalog.drillsInArea(area.id);
    const count = (formats: string[]) => drills.filter((d) => formats.includes(d.data.format)).length;
    const focusIds = catalog.focuses.filter((f) => f.data.areas.some((a) => a.id === area.id)).map((f) => f.id);
    const empty = focusIds.filter((id) => !drills.some((d) => d.data.focuses.some((f) => f.id === id))).length;
    const status = catalog.isAreaLive(area.id) ? 'live  ' : 'hidden';
    lines.push(
      `  ${status} ${area.id.padEnd(16)} ${String(drills.length).padStart(3)}   ` +
        `${count(['solo'])}/${count(['partner'])}/${count(['small-group', 'team'])}   ${empty}/${focusIds.length} empty`,
    );
  }
  const unchecked = catalog.drills.filter((d) => d.data.videos.some((v) => !v.checked));
  if (unchecked.length > 0) {
    lines.push(`  ${unchecked.length} drill(s) have videos nobody has watched yet: ${unchecked.map((d) => d.id).join(', ')}`);
  }
  console.log(lines.join('\n') + '\n');
}

// ---- Display helpers ----

const INFIELD = ['1B', '2B', 'SS', '3B'];
const OUTFIELD = ['LF', 'CF', 'RF'];

/** Expands `all`, `infield` and `outfield` into position codes, in field order. */
export function expandPositions(list: Drill['data']['positions']): string[] {
  const set = new Set<string>();
  for (const p of list) {
    if (p === 'all') POSITIONS.forEach((code) => set.add(code));
    else if (p === 'infield') INFIELD.forEach((code) => set.add(code));
    else if (p === 'outfield') OUTFIELD.forEach((code) => set.add(code));
    else set.add(p);
  }
  return POSITIONS.filter((code) => set.has(code));
}

export const FORMAT_LABELS: Record<Drill['data']['format'], string> = {
  solo: 'Solo',
  partner: 'Partner',
  'small-group': 'Small group',
  team: 'Team',
};

export const SPACE_LABELS: Record<Drill['data']['space'], string> = {
  cage: 'Batting cage',
  infield: 'Infield',
  outfield: 'Outfield',
  'open-field': 'Any open field',
  indoor: 'Indoors',
  backyard: 'Backyard',
};

export function playersLabel({ min, max }: Drill['data']['players']): string {
  if (max === undefined) return min === 1 ? 'Any number' : `${min}+ players`;
  if (min === max) return min === 1 ? '1 player' : `${min} players`;
  return `${min}–${max} players`;
}

export function agesLabel({ min, max }: Drill['data']['ages']): string {
  return max === undefined ? `${min} and up` : `${min}–${max}`;
}

export function levelLabel(levels: Drill['data']['level']): string {
  const names = levels.map((l) => l[0].toUpperCase() + l.slice(1));
  return names.length > 1 ? `${names[0]} – ${names.at(-1)}` : names[0];
}

export const categoryUrl = (c: Category) => `/${c.id}/`;
export const areaUrl = (a: Area, focusId?: string) =>
  `/${a.data.category.id}/${a.id}/${focusId ? `?focus=${focusId}` : ''}`;
export const drillUrl = (d: Drill) => `/drills/${d.id}/`;
