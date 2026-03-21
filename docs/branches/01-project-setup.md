# Branch 1: Project Setup — Monorepo & Infrastructure

**Branch:** `feature/project-setup` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 5

## What was built

Foundational monorepo structure using pnpm workspaces with Turborepo for task orchestration.

## Architecture Decisions

- **Monorepo over polyrepo:** Single repository with shared dependencies reduces version drift and enables atomic cross-package changes.
- **pnpm over npm/yarn:** Faster installs, stricter dependency resolution, native workspace support.
- **Turborepo:** Caches build outputs, runs tasks in parallel, understands dependency graph.

## Files Created

| File | Purpose |
|------|---------|
| `package.json` | Root workspace config with dev/build/lint/format scripts |
| `pnpm-workspace.yaml` | Defines `apps/*` and `packages/*` workspaces |
| `turbo.json` | Task pipeline: dev (no cache), build (cached), lint, clean |
| `tsconfig.base.json` | Shared TypeScript config (ES2022, strict, bundler resolution) |
| `docker-compose.yml` | PostgreSQL 16 + Redis 7 containers |
| `.gitignore` | node_modules, .next, dist, .env, logs, uploads, turbo cache |
| `.prettierrc` | Single quotes, trailing commas, 100 char width |
| `.env.example` | All required env vars with descriptions |
| `apps/api/` | Express.js backend scaffold (app.ts, server.ts, env config) |
| `apps/web/` | Next.js 15 frontend scaffold (App Router, Tailwind, Playwright) |
| `packages/shared/` | Shared TypeScript package placeholder |

## How to verify

```bash
cd crochet-hub
pnpm install
cd apps/api && pnpm dev  # Should start on :4000
curl http://localhost:4000/health  # {"status":"ok"}
```
