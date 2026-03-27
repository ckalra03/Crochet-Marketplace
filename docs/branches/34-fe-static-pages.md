# Branch 34: `feature/fe-static-pages` — Static Pages (About + Policies)

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Static informational pages for the Crochet Hub storefront — an About page and a full set of policy pages. All pages live inside the `(storefront)` route group and are rendered at build time (SSG) with no external data fetching.

## Pages Created

| Route | File | Purpose |
|-------|------|---------|
| `/about` | `app/(storefront)/about/page.tsx` | About Crochet Hub — hero, mission, how-it-works, why us, values |
| `/policies` | `app/(storefront)/policies/page.tsx` | Policy index with Card links to individual policies |
| `/policies/[slug]` | `app/(storefront)/policies/[slug]/page.tsx` | Dynamic policy page with `generateStaticParams` for 4 slugs |

## Policy Pages

| Slug | Title | Key Content |
|------|-------|-------------|
| `returns` | Return & Refund Policy | Ready Stock (defect-only), MTO (no preference returns), On-Demand (no preference returns), 7-day window, evidence requirements, refund process |
| `shipping` | Shipping Policy | Centralized fulfillment, QC before dispatch, timelines by product type, tracking, damaged/lost shipments |
| `terms` | Terms of Service | Platform overview, buyer/seller responsibilities, prohibited conduct, dispute resolution, IP, liability |
| `privacy` | Privacy Policy | Data collection, usage, storage/security, sharing, cookies, user rights |

## Technical Details

- **SSG**: All pages are static with no `fetch` calls; `generateStaticParams` pre-generates the four policy slugs at build time.
- **SEO**: Each page exports `metadata` (or `generateMetadata` for dynamic routes) with title and description.
- **Styling**: Tailwind CSS utility classes with prose-style layout for readable long-form content.
- **Components**: Policy index page uses `Card`, `CardHeader`, `CardTitle`, `CardDescription` from `@/components/ui/card`.
- **Semantic HTML**: Uses `<section>`, `<article>`, `<nav>`, `<ul>` for accessibility and structure.

## Key Files

- `apps/web/src/app/(storefront)/about/page.tsx`
- `apps/web/src/app/(storefront)/policies/page.tsx`
- `apps/web/src/app/(storefront)/policies/[slug]/page.tsx`
