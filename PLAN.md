# WhatTheDrill — Build Plan

> Find the right baseball drill fast: pick a category, narrow to what you want
> to get better at, watch the video, go practice.

This is a working plan. Mockups: https://claude.ai/artifact/RgbbZ6zY7J8Mbc8KE7gQaZ

---

## 1. Goals and constraints

| Goal | How the plan meets it |
| --- | --- |
| No server to run | Static site, built at deploy time, served from a CDN |
| Under $5/month | Hosting is free. $0 at launch on `*.workers.dev`; about $1/month once we buy a domain |
| Find and pick drills quickly | Four categories on the home page, then an area, then a focus; every drill on a card you can scan |
| Videos for every drill | We link or embed existing videos (YouTube first); we don't host any |
| Metadata: what each drill works on, positions | Typed drill files tagged with focuses (which roll up to areas and categories); the build fails if a field is wrong |
| Clean white look with MLB-style colors, not an MLB copy | Our own navy and red, our own wordmark, a stitch motif instead of MLB shapes |
| No accounts, nothing saved on a server | Filter state and practice plans live in the URL |
| Baseball only | One sport throughout: positions, taxonomy and copy are all baseball |

Who uses it: everyone, **tuned for youth through high school**. That means
players, parents and coaches, often **on a phone at the field**. Design for
mobile first, quick loads, big tap targets, and plain words a 12-year-old or a
first-time parent coach understands. We cover **team drills and individual
drills** equally, and every drill says which it is.

---

## 2. Architecture

```
  drills/*.md  ──►  Astro build (Cloudflare Workers Builds)  ──►  static HTML/CSS/JS
  taxonomy/*.yaml        │  validates schema with Zod                 │
                         │  fails build on bad data                   ▼
                         └─ weekly video-link check ──►  Cloudflare CDN, static assets (free)
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
| Build and hosting | Cloudflare Workers with static assets only (`wrangler.jsonc`): free and unlimited for static files, builds from GitHub, preview URL per branch | $0 |
| Domain | Free `*.workers.dev` address at launch; `whatthedrill.com` through Cloudflare Registrar later | $0 now; about $10.50/yr (about **$0.90/mo**) once bought |
| Analytics | Cloudflare Web Analytics (no cookies, no banner) | $0 |
| Video link checks | Scheduled GitHub Action calling YouTube oEmbed (no API key) | $0 |
| **Total** | | **$0 now, under $1/month with the domain** |

GitHub Pages is an equally free fallback. Cloudflare wins on preview deploys,
redirects, and the registrar living in the same place. Cloudflare now sets up
new Git-connected projects as Workers rather than Pages. A static-assets-only
Worker costs the same ($0) and needs no adapter.

**Domain (decided):** launch on the free `*.workers.dev` address. If the site
works out, buy `whatthedrill.com` and attach it in Cloudflare. That's a
settings change, not a rebuild.

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
focuses: [rolling-over, long-swing]   # refs to taxonomy/focuses.yaml; areas and categories are derived
positions: [all]                   # P C 1B 2B SS 3B LF CF RF | infield | outfield | all
level: [beginner, intermediate]    # beginner | intermediate | advanced
ages: { min: 7, max: 18 }
format: partner                    # solo | partner | small-group | team
players: { min: 2, max: 2 }
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

### Taxonomy: categories → areas → focuses (`src/content/taxonomy/`)

There are three levels, and drills are tagged at the bottom one only:

- **Categories** (`categories.yaml`) are the few big tiles on the home page.
- **Areas** (`areas.yaml`) are what someone wants to get better at, in their
  own words ("Make better contact"). Each area belongs to one category and
  has a title, a one-line blurb and an icon.
- **Focuses** (`focuses.yaml`) are the specific things inside an area. Each
  one is either a **fix** (something going wrong: "rolling over") or a
  **build** (something to develop: "bat speed"). A focus can sit under more
  than one area. Fixes also get "signs you'll see" so a parent can recognize
  them.
- **Drills list focuses only.** Areas and categories are worked out from the
  focuses, so there's one place to tag and nothing to keep in sync.

```yaml
# areas.yaml
- slug: make-contact
  title: Make better contact
  category: hitting
  blurb: Square up more balls and stop giving away at-bats.

# focuses.yaml
- slug: rolling-over
  label: Rolling over
  kind: fix
  areas: [make-contact]
  signs: Weak grounders to the pull side; top hand flips over at contact.
- slug: first-step
  label: Quicker first step
  kind: build
  areas: [ground-balls, speed]      # one focus can sit under several areas
```

#### Home page: 4 categories plus a "Just starting out" banner

| Category | Areas | Focuses (✗ fix · ✓ build) |
|---|---|---|
| **Hitting** | Make better contact | ✗ swinging and missing · ✗ rolling over · ✗ popping up · ✗ long, loopy swing · ✗ eyes off the ball · ✗ stepping in the bucket · ✗ dropping the hands |
| | Hit with more power | ✓ bat speed · ✓ using the legs and hips · ✓ driving the ball in the air · ✓ strength for hitters |
| | Swing at better pitches | ✗ late on fastballs · ✗ chasing bad pitches · ✓ pitch recognition · ✓ two-strike hitting · ✓ bunting |
| **Defense** | Field ground balls cleanly | ✗ not getting low · ✗ stabbing at the ball · ✗ backhand trouble · ✓ footwork into the throw · ✓ quicker first step · ✓ double plays |
| | Catch more fly balls | ✗ misjudging fly balls · ✗ drifting under the ball · ✓ drop steps · ✓ calling for it · ✓ catching in the sun |
| | Become a better catcher | ✗ balls getting by in the dirt · ✗ slow throws to second · ✓ receiving and framing · ✓ stance |
| **Throwing & Pitching** | Make better throws | ✗ throws all over the place · ✗ short-arming · ✗ all arm, no legs · ✗ slow transfer · ✓ four-seam grip · ✓ arm strength |
| | Throw more strikes | ✗ too many walks · ✗ flying open · ✗ inconsistent release · ✗ no follow-through · ✓ pitching from the stretch · ✓ velocity (13 and up) |
| | Warm up and protect your arm | ✓ throwing warm-up routine · ✓ arm care · ✓ long toss · ✓ pitch counts and rest (guidance page, not drills) |
| **Speed & Baserunning** | Run the bases smarter | ✗ slow out of the box · ✗ wide turns · ✓ leads · ✓ sliding · ✓ reading the ball |
| | Get faster and quicker | ✓ sprint speed · ✓ quicker first step · ✓ agility · ✓ footwork |
| **Just starting out** (banner, not a tile) | Learn the basics | ✓ how to throw · ✓ how to catch · ✓ how to swing · ✓ how to run the bases |
| | Play without fear | ✗ bailing out at the plate · ✗ scared of hard grounders · ✗ nervous behind the plate · ✓ getting hit by a pitch safely |

Why this shape:
- **Four tiles** fit a 2×2 grid on a laptop and four stacked rows on a phone.
  Each tile lists its areas, so people can see what's inside before tapping.
- **"Just starting out" is a navy banner** under the tiles rather than a fifth
  tile. Beginners and nervous players are an audience, not a skill, and the
  banner makes them easy to spot.
- **Arm care is now an area** instead of a close call, since Throwing &
  Pitching had room for a third.
- Close calls still folded in: double plays (in ground balls), bunting (in
  better pitches), game situations (later).

**Labels on area pages:** an area made of fixes asks "What's happening?" An
area made of builds asks "What to build". Mixed areas show both rows.

#### "How are you practicing?" is a separate question

Situations aren't areas, so they're a row of chips under the tiles that
applies to whichever tile is picked. Each one maps to existing drill fields:

| Chip | Drill field |
|---|---|
| Alone | `format: solo` |
| With a partner | `format: partner` |
| Team practice | `format: small-group` or `team` |
| Indoors | `space: indoor` or `backyard` |
| 10 min or less | `duration_min <= 10` |

**Validation in CI:**
- Every `focuses`, `positions` and `related` reference must exist. Every
  focus names at least one area, and every area names a category.
- Every drill rolls up to at least one area.
- An area only shows once it has 5 or more drills, and a category only shows
  once it has at least one live area. A half-empty page never goes live. The
  build prints a coverage report per area: drill count, solo vs. team, and
  focuses with no drills yet.
- Every drill has at least one video, and slugs are unique.

---

## 4. Site structure and UX

| Route | Purpose |
| --- | --- |
| `/` | **"What do you want to get better at?"** 4 category tiles (each listing its areas), the "Just starting out" banner, a "How are you practicing?" chip row, and a small search for people who already know what's wrong |
| `/[category]` | e.g. `/hitting`: one card per area with its focus chips. Tapping a chip jumps straight to the area page with that focus picked. Plus a few "good for everyone" drills. On a phone the area cards are an accordion |
| `/[category]/[area]` | e.g. `/hitting/make-contact`: focus chips (with drill counts), practicing chips, then the drill cards. State lives in the URL (`?focus=rolling-over&who=solo`) |
| `/drills` | Full filter view: skill, position, focus, who's practicing, time, equipment, level. Filters live in the URL so they can be shared and bookmarked |
| `/drills/[slug]` | Video first, then steps, cues, mistakes, a metadata strip, and related drills |
| `/focus/[slug]` | One focus: what it looks like ("signs you'll see"), then its drills, solo drills first. Good landing pages for search engines |
| `/positions/[slug]` | Every drill for a position |
| `/about` | What the site is, video credits and sources |

### Making it quick to decide

- **Drill cards** show what matters at a glance: title, a one-line summary, the
  focuses it works on (chips), minutes, player count and equipment (simple line
  icons, no emoji), a thumbnail, and a Solo / Partner / Team badge.
- **Three taps to a video:** category → focus chip (from the category page)
  → drill. Or category → area → drill if you don't pick a focus.
- **The practicing choice carries through.** Pick "Alone" on the home page
  and every page after it is already filtered to solo drills.
- **Position diamond** on `/positions`: tap a spot on the field to see its
  drills. The home page links to it.
- **Lite YouTube embed:** show the thumbnail and load the player only on tap,
  through `youtube-nocookie.com`. That keeps pages fast and tracker-free.
- **"Who's practicing" filter (Solo / Partner / Team)** sits first in the
  filters. It's the biggest fork between a kid in the backyard and a coach
  running practice. There are also "No equipment" and "Under 10 minutes" quick
  picks.
- **Related drills** are hand-picked first, then filled in by shared focuses.

### Later, still serverless

- **Practice plan builder:** pick drills and the plan is encoded in the URL
  (`/plan?d=tee-inside-outside,short-hop-pickups`). Print-friendly and shareable
  by text, with nothing stored.
- **Printable drill cards** using a print stylesheet.

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
scoreboard feel. Barlow for body text: a sturdy companion that's easy to read
outdoors. Both are OFL-licensed and self-hosted.

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
- **Curated by the owner.** No public submissions. Claude researches and
  drafts drill files with candidate videos → the owner reviews (watches the
  video, checks the drill fits) → sets `checked` → merge.
- **Video sources:** no block list. Any clear, accurate demo qualifies; prefer
  ones that show youth or HS players when the quality is equal.
- **Coverage target for v1:** roughly half individual (solo or partner) and
  half team drills, and every position has at least 3 drills of its own.
- **Link rot:** a weekly GitHub Action asks YouTube oEmbed about every URL
  (`https://www.youtube.com/oembed?url=…`; a 401 or 404 means it's gone or
  private) and opens an issue listing dead links.

---

## 7. Quality bar

- Lighthouse 95+ on all four categories. Pages under 100 KB before video.
- Accessible: keyboard-operable filters, visible focus (stitch-red ring), AA
  contrast, `aria-live` count of results.
- SEO: one page per drill, category, area, focus and position; `VideoObject` / `HowTo`
  structured data; sitemap; Open Graph images generated at build time.
- CI on every PR: `astro check`, schema validation, build, link check.

---

## 8. Milestones

1. **Skeleton:** ✅ built. Astro 7 project, content schema with cross-reference
   validation, design tokens, layout, the category → area → drill pages,
   "How are you practicing?" filtering, lite YouTube embeds, CI, and 5 sample
   drills. `MIN_DRILLS_PER_AREA` is 1 until Content v1. Deploys to
   Cloudflare as a static-assets Worker (steps in README.md). Remaining:
   watch the 5 videos and set `site` to the live URL.
2. **Content v1:** ✅ 77 drills written, every area has 5–10 and every
   focus has at least one. `MIN_DRILLS_PER_AREA` is now 5. Each video was
   confirmed to exist via YouTube oEmbed, but none is marked `checked` yet:
   the owner still needs to watch them and confirm each one shows its drill.
3. **Find and decide:** category home, category and area pages, filters with
   URL state, focus and position pages, related drills, lite embeds.
4. **Polish and launch:** logo and wordmark, OG images, structured data,
   analytics, accessibility pass, custom domain.
5. **Extras:** practice plan builder, print cards, video link-check bot.
6. **Domain:** buy `whatthedrill.com` if the site is a keeper.

---

## 9. Decisions log

| Question | Decision |
| --- | --- |
| Audience | Everyone, tuned for youth through high school |
| Drill types | Team and individual drills, both first-class |
| Sport | Baseball only |
| Domain | Free `*.workers.dev` first; buy `whatthedrill.com` later if it's a keeper |
| Contributions | Curated by the owner only |
| Video sources | No restrictions |
| Mockups | Done: Option A (problem-first home, finder, drill page, phone views), Option B (category home, category page, area page, phone home and category), brand sheet |
| Landing page | Option B: category tiles. Problem search stays as a secondary path |
| Tagging | Drills tag `focuses` (fix or build); areas and categories are derived. Replaces the old `problems` field |
| Structure | 4 categories + "Just starting out" banner → 13 areas → focuses, as listed in section 3 |
