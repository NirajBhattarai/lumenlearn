# ADR-010: Deploy via Next.js static export on GitHub Pages

**Status:** Accepted  
**Date:** 2026-08-05

## Context

The GitHub UI added a **Jekyll** Pages workflow (`jekyll-gh-pages.yml`). LumenLearn is a Next.js App Router app, not a Jekyll site. Jekyll would ignore or mis-handle `src/`, `_next/`, and the lesson runtime.

GitHub Pages only serves static files. There is no Node server.

## Decision

1. Use `output: "export"` so `next build` writes a static `out/` directory.
2. Replace the Jekyll workflow with a Node build → `actions/upload-pages-artifact` → `actions/deploy-pages` pipeline.
3. Set `basePath: "/lumenlearn"` only when `GITHUB_PAGES=true` (project site URL).
4. Ship `.nojekyll` so Pages does not skip `_next/` (underscore paths).
5. Keep `images.unoptimized` — no image optimization server on Pages.
6. Dynamic routes already expose `generateStaticParams`.

Local `next dev` is unchanged. Preview a Pages-shaped build with:

```bash
GITHUB_PAGES=true npm run build
npx --yes serve out
# open /lumenlearn/
```

## Consequences

- No SSR, route handlers, or ISR on the public site.
- Custom domains should omit `basePath` (unset `GITHUB_PAGES` or split config later).
- Client navigations depend on pre-rendered HTML for every lesson/subject slug.
