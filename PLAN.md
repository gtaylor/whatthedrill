# WhatTheDrill — Build Plan

> Find the right baseball drill fast: pick what you want to get better at,
> narrow it to how you're practicing, watch the video, go practice.

This is a working plan. Mockups: https://claude.ai/artifact/RgbbZ6zY7J8Mbc8KE7gQaZ

---

## 1. Goals and constraints

| Goal | How the plan meets it |
| --- | --- |
| No server to run | Static site, built at deploy time, served from a CDN |
| Under $5/month | Hosting is free. $0 at launch on `*.pages.dev`; about $1/month once we buy a domain |
| Find and pick drills quickly | Start from a goal tile, narrow by focus and setup, every drill on a card you can scan |
| Videos for every drill | We link or embed existing videos (YouTube first); we don't host any |
| Metadata: what each drill works on, positions | Typed drill files tagged with focuses (which roll up to goals); the build fails if a field is wrong |
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
| Domain | Free `whatthedrill.pages.dev` at launch; `whatthedrill.com` through Cloudflare Registrar later | $0 now; about $10.50/yr (about **$0.90/mo**) once bought |
| Analytics | Cloudflare Web Analytics (no cookies, no banner) | $0 |
| Video link checks | Scheduled GitHub Action calling YouTube oEmbed (no API key) | $0 |
| **Total** | | **$0 now, under $1/month with the domain** |

GitHub Pages is an equally free fallback. Cloudflare wins on preview deploys,
redirects, and the registrar living in the same place.

**Domain (decided):** launch on the free `*.pages.dev` address. If the site
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
focuses: [rolling-over, long-swing]   # refs to taxonomy/focuses.yaml; goals are derived from these
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

### Taxonomy: goals and focuses (`src/content/taxonomy/`)

There are two levels, and drills are tagged at the lower one only:

- **Goals** (`goals.yaml`) are the landing-page tiles: what someone wants to
  get better at, in their own words. Each one has a slug, a title, a one-line
  blurb, an icon, a skill label and a sort order.
- **Focuses** (`focuses.yaml`) are the specific things inside a goal. Each one
  is either a **fix** (something going wrong: "rolling over") or a **build**
  (something to develop: "bat speed"). Each focus belongs to one or more
  goals. Fixes also get "signs you'll see" so a parent can recognize them.
- **Drills list focuses only.** A drill's goals are worked out from its
  focuses, so there's one place to tag and nothing to keep in sync.

```yaml
# focuses.yaml
- slug: rolling-over
  label: Rolling over
  kind: fix
  goals: [make-contact]
  signs: Weak grounders to the pull side; top hand flips over at contact.
- slug: first-step
  label: Quicker first step
  kind: build
  goals: [ground-balls, speed]      # one focus can sit under several goals
```

#### The 12 goal tiles (v1)

| # | Goal (tile) | Skill label | Focuses (✗ fix · ✓ build) |
|---|---|---|---|
| 1 | Make better contact | Hitting | ✗ swinging and missing · ✗ rolling over · ✗ popping up · ✗ long, loopy swing · ✗ eyes off the ball · ✗ stepping in the bucket · ✗ dropping the hands |
| 2 | Hit with more power | Hitting | ✓ bat speed · ✓ using the legs and hips · ✓ driving the ball in the air · ✓ strength for hitters |
| 3 | Swing at better pitches | Hitting | ✗ late on fastballs · ✗ chasing bad pitches · ✓ pitch recognition · ✓ two-strike hitting · ✓ bunting |
| 4 | Field ground balls cleanly | Fielding | ✗ not getting low · ✗ stabbing at the ball · ✗ backhand trouble · ✓ footwork into the throw · ✓ quicker first step · ✓ double plays |
| 5 | Catch more fly balls | Fielding | ✗ misjudging fly balls · ✗ drifting under the ball · ✓ drop steps · ✓ calling for it · ✓ catching in the sun |
| 6 | Make better throws | Throwing | ✗ throws all over the place · ✗ short-arming · ✗ all arm, no legs · ✗ slow transfer · ✓ four-seam grip · ✓ arm strength · ✓ arm care and warm-ups |
| 7 | Throw more strikes | Pitching | ✗ too many walks · ✗ flying open · ✗ inconsistent release · ✗ no follow-through · ✓ pitching from the stretch · ✓ velocity (13 and up) |
| 8 | Become a better catcher | Catching | ✗ balls getting by in the dirt · ✗ slow throws to second · ✓ receiving and framing · ✓ stance |
| 9 | Run the bases smarter | Baserunning | ✗ slow out of the box · ✗ wide turns · ✓ leads · ✓ sliding · ✓ reading the ball |
| 10 | Get faster and quicker | Athleticism | ✓ sprint speed · ✓ quicker first step · ✓ agility · ✓ footwork |
| 11 | Play without fear | Confidence | ✗ bailing out at the plate · ✗ scared of hard grounders · ✗ nervous behind the plate · ✓ getting hit by a pitch safely |
| 12 | Learn the basics | Beginners | ✓ how to throw · ✓ how to catch · ✓ how to swing · ✓ how to run the bases |

**Close calls** (folded in for now, could become tiles later): arm care and
warm-ups (in #6 and #7), double plays (in #4), bunting and small ball (in #3),
and game situations ("know where to throw it").

#### "How are you practicing?" is a separate question

Situations aren't goals, so they're a row of chips under the tiles that
applies to whichever tile is picked. Each one maps to existing drill fields:

| Chip | Drill field |
|---|---|
| Alone | `format: solo` |
| With a partner | `format: partner` |
| Team practice | `format: small-group` or `team` |
| Indoors | `space: indoor` or `backyard` |
| 10 min or less | `duration_min <= 10` |

**Validation in CI:**
- Every `focuses`, `positions` and `related` reference must exist, and every
  focus must name at least one goal.
- Every drill rolls up to at least one goal.
- A goal tile only shows once it has 5 or more drills, so a half-empty tile
  never goes live. The build prints a coverage report per goal: drill count,
  solo vs. team, and focuses with no drills yet.
- Every drill has at least one video, and slugs are unique.

---

## 4. Site structure and UX

| Route | Purpose |
| --- | --- |
| `/` | **"What do you want to get better at?"** 12 goal tiles, a "How are you practicing?" chip row, and a small search for people who already know what's wrong (Option B in the mockups) |
| `/goals/[slug]` | One goal: its focus chips (with drill counts), the practicing chips, then the drill cards. State lives in the URL (`/goals/make-contact?focus=rolling-over&who=solo`) |
| `/drills` | Full filter view: skill, position, focus, who's practicing, time, equipment, level. Filters live in the URL so they can be shared and bookmarked |
| `/drills/[slug]` | Video first, then steps, cues, mistakes, a metadata strip, and related drills |
| `/focus/[slug]` | One focus: what it looks like ("signs you'll see"), then its drills, solo drills first. Good landing pages for search engines |
| `/positions/[slug]` | Every drill for a position |
| `/about` | What the site is, video credits and sources |

### Making it quick to decide

- **Drill cards** show what matters at a glance: title, a one-line summary, the
  focuses it works on (chips), minutes, player count and equipment (simple line
  icons, no emoji), a thumbnail, and a Solo / Partner / Team badge.
- **Three taps or fewer to a video:** goal tile → focus (or "Show all") →
  drill.
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
- SEO: one page per drill, goal, focus and position; `VideoObject` / `HowTo`
  structured data; sitemap; Open Graph images generated at build time.
- CI on every PR: `astro check`, schema validation, build, link check.

---

## 8. Milestones

1. **Skeleton:** Astro project, content schema, design tokens, layout,
   5 sample drills, deployed to `*.pages.dev`.
2. **Content v1:** final goals and focuses, plus 50 drills with checked
   videos, enough for every v1 tile to pass the 5-drill minimum. Validation CI
   and coverage report.
3. **Find and decide:** goal tiles home, goal pages, filters with URL state,
   focus and position pages, related drills, lite embeds.
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
| Domain | Free `*.pages.dev` first; buy `whatthedrill.com` later if it's a keeper |
| Contributions | Curated by the owner only |
| Video sources | No restrictions |
| Mockups | Done: Option A (problem-first home, finder, drill page, phone views), Option B (goal tiles home, goal page, phone tiles), brand sheet |
| Landing page | Leaning toward Option B, goal tiles. Problem search stays as a secondary path |
| Tagging | Drills tag `focuses` (fix or build); goals are derived. Replaces the old `problems` field |
| Goal tiles | The 12 listed in section 3 |
