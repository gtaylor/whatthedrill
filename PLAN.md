# WhatTheDrill — Build Plan

> Find the right baseball drill fast: start from what's going wrong, filter by
> position and setup, watch the video, go practice.

This is a working plan. Items marked **(decide)** are open questions.

---

## 1. Goals and constraints

| Goal | How the plan meets it |
| --- | --- |
| No server to run | Static site, built at deploy time, served from a CDN |
| Under $5/month | Hosting is free; the only cost is a domain (about $1/month) |
| Find and pick drills quickly | Start from the problem, filter instantly, every drill on a card you can scan |
| Videos for every drill | We link or embed existing videos (YouTube first); we don't host any |
| Metadata: problems fixed, positions | Typed drill files with a checked schema; the build fails if a field is wrong |
| Clean white look with MLB-style colors, not an MLB copy | Our own navy and red, our own wordmark, a stitch motif instead of MLB shapes |
| No accounts, nothing saved on a server | Filter state and practice plans live in the URL |

Who uses it (assumed): youth/HS coaches and parents, often **on a phone at the
field**. Design for mobile first, quick loads, and big tap targets.

---

## 2. Architecture

```
  drills/*.md  ──►  Astro build (GitHub Actions / CF Pages)  ──►  static HTML/CSS/JS
  taxonomy/*.yaml        │  validates schema with Zod                 │
                         │  fails build on bad data                   ▼
                         └─ weekly video-link check ──►  Cloudflare Pages CDN (free)
```

### Stack

- **Astro** (static output). Content Collections give typed Markdown with Zod
  validation, and pages ship no JavaScript by default.
- **No UI framework.** The drill list renders on the server. A small vanilla
  TypeScript script filters it by showing and hiding cards through `data-*`
  attributes. Without JS, every drill still shows.
- **Plain CSS with custom properties** for the design tokens. No Tailwind, so
  there are fewer dependencies to keep up to date.
- **Fuse.js** (about 6 KB) for fuzzy text search over a JSON index generated at
  build time. Pagefind is the fallback if we pass roughly 1,000 drills.
- **Fonts** self-hosted through `@fontsource`, so there are no Google Fonts
  requests.

### Hosting and ops

| Piece | Service | Cost |
| --- | --- | --- |
| Source, issues, CI | GitHub (this repo) | $0 |
| Build and hosting | Cloudflare Pages (unlimited bandwidth, 500 builds/mo, preview deploy per PR) | $0 |
| Domain | Cloudflare Registrar, `.com` at cost | about $10.50/yr, about **$0.90/mo** |
| Analytics | Cloudflare Web Analytics (no cookies, no banner) | $0 |
| Video link checks | Scheduled GitHub Action calling YouTube oEmbed (no API key) | $0 |
| **Total** | | **under $1/month** |

GitHub Pages is an equally free fallback. Cloudflare wins on preview deploys,
redirects, and the registrar living in the same place.

**(decide)** Domain: `whatthedrill.com`. Check availability; `.app` and `.dev`
are about $12–14/yr if it's taken.

---

## 3. Data model

Each drill is one Markdown file. Structured facts go in the frontmatter (the
schema checks them); coaching prose goes in the body.

```markdown
---
title: Tee Work – Inside/Outside
slug: tee-inside-outside
summary: Move the tee to teach the hands where each pitch location is hit.
skill: hitting                     # hitting | fielding | throwing | pitching | catching | baserunning | conditioning
problems: [rolling-over, casting, late-on-inside-pitch]   # taxonomy refs
positions: [all]                   # P C 1B 2B SS 3B LF CF RF | infield | outfield | all
level: [beginner, intermediate]    # beginner | intermediate | advanced
ages: { min: 7, max: 18 }
players: { min: 1, max: 2 }        # solo, partner, small group, team
duration_min: 10
equipment: [tee, bat, balls, net]
space: cage                        # cage | infield | outfield | open-field | indoor | backyard
videos:
  - url: https://www.youtube.com/watch?v=XXXXXXXXXXX
    start: 42                      # seconds, optional
    channel: Example Coaching Channel
    title: Inside/Outside Tee Drill
    checked: 2026-10-16            # last time someone watched it and confirmed it fits
related: [one-hand-tee, high-tee]
---

## How to run it
1. ...

## Coaching cues
- "Inside pitch, catch it out front."

## Common mistakes
- ...

## Make it harder / easier
- ...
```

### Taxonomy (`src/content/taxonomy/`)

Problems are their own entries, each with a description and "signs you'll
see," so they can have their own pages and wording kids and parents use. First
draft:

- **Hitting:** casting / long swing, dropping hands, lunging / weight forward
  early, stepping in the bucket, pulling head, uppercut / pop-ups, rolling over,
  late on fastballs, chasing bad pitches, low bat speed, bailing / fear of ball
- **Fielding:** not getting low, poor glove presentation, backhand trouble, bad
  footwork into the throw, slow first step, misjudging fly balls, drifting on
  fly balls, double play feeds and turns
- **Throwing:** short-arming / pushing, inaccurate throws, no four-seam grip,
  arm-only (no lower half), slow transfer
- **Pitching:** walks / poor control, flying open, inconsistent release point,
  no follow-through, slow from the stretch
- **Catching:** blocking balls in the dirt, framing, slow pop time, fear behind
  the plate
- **Baserunning:** slow out of the box, poor leads, wide turns, sliding

**Validation in CI:** every `problems`, `positions`, and `related` reference has
to exist, every drill has at least one video, and slugs are unique.

---

## 4. Site structure and UX

| Route | Purpose |
| --- | --- |
| `/` | Hero search: **"What's going wrong?"** Problem chips grouped by skill, plus "Browse all drills" |
| `/drills` | Filterable list: skill, position, problem, players, time, equipment, level. Filters live in the URL (`?pos=SS&problem=backhand`) so they can be shared and bookmarked |
| `/drills/[slug]` | Video first, then steps, cues, mistakes, a metadata strip, and related drills |
| `/problems/[slug]` | What the problem looks like, then its drills sorted by fit, solo drills first |
| `/positions/[slug]` | Every drill for a position |
| `/about` | What the site is, video credits and sources, a link to suggest a drill |

### Making it quick to decide

- **Drill cards** show what matters at a glance: title, a one-line summary, the
  problems it fixes (chips), ⏱ minutes, 👤 player count, 🧰 equipment icons, and
  a thumbnail.
- **Lite YouTube embed:** show the thumbnail and load the player only on tap,
  through `youtube-nocookie.com`. That keeps pages fast and tracker-free.
- **"Solo drill" / "No equipment"** quick toggles. These are the most common
  constraints at home.
- **Related drills** are hand-picked first, then filled in by shared problems.

### Later, still serverless

- **Practice plan builder:** pick drills and the plan is encoded in the URL
  (`/plan?d=tee-inside-outside,short-hop-pickups`). Print-friendly and shareable
  by text, with nothing stored.
- **Printable drill cards** using a print stylesheet.
- **Suggest a drill:** a GitHub Issue form template, or a free Google Form.

---

## 5. Visual design

Mostly white with a lot of space. Navy carries the text, red is used sparingly,
and the colors are close to MLB's but not identical.

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#FFFFFF` | Page background (most of the screen) |
| `--chalk` | `#F6F8FA` | Card and section backgrounds |
| `--line` | `#E2E7EE` | Borders and dividers |
| `--ink` | `#0E2A47` | Text and header ("deep navy"; MLB's is `#041E42`) |
| `--ink-soft` | `#4A5D75` | Secondary text |
| `--stitch` | `#C62A3B` | Primary actions, active filters, the stitch motif (about 5.5:1 on white, passes AA) |
| `--sky` | `#E3EDF8` | Selected chips and hover tints |
| `--grass` / `--clay` | `#2F7D4F` / `#B5653A` | Rare skill-category accents, if needed |

**Staying clear of MLB's identity:**

- No batter silhouette, and no blue/red split rectangle in the logo.
- No team names, logos, uniform numbers, or "MLB" anywhere in branding.
- Our own motif: **red baseball stitching** (a curved double row of V-ticks)
  for section dividers, focus rings, and the logo mark.
- Wordmark idea: **What*The*Drill**, with "The" set smaller in stitch red, or
  the "?" built from a seam curve.

**Type:** Barlow Condensed (bold, all caps) for headings, which gives a
scoreboard feel. Inter for body text. Both are OFL-licensed and self-hosted.

Light theme only for v1 since white is the identity. Dark mode can come later.

---

## 6. Content strategy

- **Start with 50–75 drills** across all skills and positions, weighted toward
  the most common youth problems. Then add steadily.
- **We write our own** summaries, steps, and cues. We don't copy text from
  other sites.
- **Videos:** embed or link only, credit the channel, and prefer established
  coaching channels and organizations with clear demos. Store `start` so the
  embed jumps to the right moment.
- **Workflow:** Claude researches and drafts drill files with candidate videos
  → the owner reviews (watches the video, checks the drill fits) → sets
  `checked` → merge.
- **Link rot:** a weekly GitHub Action asks YouTube oEmbed about every URL
  (`https://www.youtube.com/oembed?url=…`; a 401 or 404 means it's gone or
  private) and opens an issue listing dead links.

---

## 7. Quality bar

- Lighthouse 95+ on all four categories. Pages under 100 KB before video.
- Accessible: keyboard-operable filters, visible focus (stitch-red ring), AA
  contrast, `aria-live` count of results.
- SEO: one page per drill, problem, and position; `VideoObject` / `HowTo`
  structured data; sitemap; Open Graph images generated at build time.
- CI on every PR: `astro check`, schema validation, build, link check.

---

## 8. Milestones

1. **Skeleton:** Astro project, content schema, design tokens, layout,
   5 sample drills, deployed to `*.pages.dev`.
2. **Content v1:** final taxonomy plus 50 drills with checked videos.
   Validation CI.
3. **Find and decide:** home search, filters with URL state, problem and
   position pages, related drills, lite embeds.
4. **Polish and launch:** logo and wordmark, OG images, structured data,
   analytics, accessibility pass, custom domain.
5. **Extras:** practice plan builder, print cards, suggest-a-drill form, video
   link-check bot.

---

## 9. Open questions

1. **Audience and age range:** youth (6–12), teen and HS, or all levels? This
   sets the reading level and which drills come first.
2. **Coaches vs. players:** team drills for practice plans, or solo and
   backyard work for players, or both equally?
3. **Softball:** baseball only, or tag drills that also work for softball?
4. **Domain:** is `whatthedrill.com` available, or do you already own one?
5. **Contributions:** keep it curated by you, or let people suggest drills
   (GitHub issue form or Google Form)?
6. **Video sources:** any channels or coaches you trust (or want to avoid)?
