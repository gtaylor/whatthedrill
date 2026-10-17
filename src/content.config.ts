import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ICON_NAMES } from './lib/icons';
import { POSITION_GROUPS, POSITIONS } from './lib/positions';
import { youtubeId } from './lib/youtube';

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase words joined by dashes');

const categories = defineCollection({
  loader: file('src/content/taxonomy/categories.yaml'),
  schema: z.object({
    id: slug,
    title: z.string(),
    blurb: z.string(),
    icon: z.enum(ICON_NAMES),
    order: z.number().int(),
    // The "Just starting out" banner sits under the tiles instead of being one.
    banner: z.boolean().default(false),
  }),
});

const areas = defineCollection({
  loader: file('src/content/taxonomy/areas.yaml'),
  schema: z.object({
    id: slug,
    title: z.string(),
    category: reference('categories'),
    blurb: z.string(),
    icon: z.enum(ICON_NAMES),
    order: z.number().int(),
  }),
});

const focuses = defineCollection({
  loader: file('src/content/taxonomy/focuses.yaml'),
  schema: z.object({
    id: slug,
    label: z.string(),
    kind: z.enum(['fix', 'build']),
    areas: z.array(reference('areas')).min(1),
    signs: z.string().optional(),
    note: z.string().optional(),
  }),
});

const drills = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/drills' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(160),
    focuses: z.array(reference('focuses')).min(1),
    positions: z.array(z.enum([...POSITIONS, ...POSITION_GROUPS])).min(1),
    level: z.array(z.enum(['beginner', 'intermediate', 'advanced'])).min(1),
    ages: z.object({ min: z.number().int().min(4), max: z.number().int().max(99).optional() }),
    format: z.enum(['solo', 'partner', 'small-group', 'team']),
    players: z.object({ min: z.number().int().min(1), max: z.number().int().optional() }),
    duration_min: z.number().int().positive(),
    equipment: z.array(z.string()),
    space: z.enum(['cage', 'infield', 'outfield', 'open-field', 'indoor', 'backyard']),
    videos: z
      .array(
        z.object({
          url: z.string().refine((u) => youtubeId(u) !== null, 'Must be a YouTube watch, youtu.be or shorts URL'),
          start: z.number().int().nonnegative().optional(),
          channel: z.string(),
          title: z.string(),
          // Set once a person has watched the video and confirmed it shows this drill.
          checked: z.coerce.date().optional(),
        }),
      )
      .min(1),
    related: z.array(reference('drills')).default([]),
  }),
});

export const collections = { categories, areas, focuses, drills };
