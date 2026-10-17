# WhatTheDrill

Find the right baseball drill fast. Pick a category, narrow it to what you want
to get better at, watch the video, go practice.

A static site built with [Astro](https://astro.build). There's no server and no
database. Hosting is free on Cloudflare Pages. See [PLAN.md](PLAN.md) for the full plan.

## Run it locally

Requires Node 22 or newer.

```sh
npm install
npm run dev      # http://localhost:4321, reloads as you edit
npm run check    # type-check and validate content
npm run build    # production build into dist/, prints the coverage report
npm run preview  # serve dist/ locally
```

## How the content works

```
src/content/
  taxonomy/
    categories.yaml   # the 4 home page tiles + the "Just starting out" banner
    areas.yaml        # what people want to get better at; each belongs to one category
    focuses.yaml      # specific fixes and builds; each belongs to one or more areas
  drills/
    *.md              # one file per drill; the filename is its URL
```

Drills are tagged with **focuses only**. A drill's areas and categories are
worked out from its focuses, so there's one place to tag.

An area only appears on the site once it has `MIN_DRILLS_PER_AREA` drills
(set in `src/lib/catalog.ts`). A category only appears once it has a live area.
Every build prints a coverage report: drills per area, the solo/partner/team
split, how many focuses have no drills yet, and which drills have videos nobody
has watched.

### Add a drill

1. Copy an existing file in `src/content/drills/` and rename it. Use lowercase
   words with dashes, like `wall-ball-backhands.md`.
2. Fill in the frontmatter. `focuses` must use ids from `focuses.yaml`, and
   `related` must use other drill filenames (without `.md`).
3. Write the body with the same four sections: How to run it, Coaching cues,
   Common mistakes, Make it easier or harder.
4. Watch the video. Once you've confirmed it shows the drill, add
   `checked: YYYY-MM-DD` under the video.
5. Run `npm run build`. A typo in an id, a missing field or a non-YouTube URL
   fails the build with a message saying which file and field.

## Deploy to Cloudflare Pages (free)

One-time setup, done in the Cloudflare dashboard:

1. Sign in (or sign up free) at <https://dash.cloudflare.com>.
2. Go to **Workers & Pages → Create → Pages → Connect to Git** and pick the
   `gtaylor/whatthedrill` repository.
3. Use these build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. Choose the production branch (normally `main`). Every other branch and pull
   request gets its own preview URL.
5. Save and deploy. The site goes live at `https://<project-name>.pages.dev`.

After that, every push deploys automatically. If the project name isn't
`whatthedrill`, update `site` in `astro.config.mjs` so canonical URLs match.

To add `whatthedrill.com` later: buy it in **Domain Registration**, then go to
the Pages project's **Custom domains** tab and add it. Update `site` in
`astro.config.mjs` to match.
