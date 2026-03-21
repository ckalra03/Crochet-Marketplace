# Crochet Hub Web

Next.js 15 frontend for the Crochet Hub marketplace.

## Setup

```bash
cd apps/web
pnpm install
pnpm dev          # Start on http://localhost:3000
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx      # Root layout (providers, fonts, theme)
│   ├── page.tsx        # Landing page
│   ├── globals.css     # Tailwind + CSS variables (light/dark)
│   ├── (auth)/         # Login, Register, Forgot/Reset Password
│   ├── (storefront)/   # Home, Catalog, Product Detail
│   ├── (buyer)/        # Cart, Checkout, Orders, Returns, Profile
│   ├── (seller)/       # Dashboard, Products, Orders, Payouts
│   └── (admin)/        # Dashboard, Approvals, QC, Disputes, Payouts
├── components/
│   ├── ui/             # shadcn/ui primitives
│   ├── layout/         # Nav, Footer, Sidebar, Breadcrumbs
│   ├── product/        # ProductCard, Gallery, Filter, TypeBadge
│   ├── order/          # Timeline, StatusBadge, LineItems
│   ├── forms/          # MultiStep, ImageUploader, StarRating
│   ├── dashboard/      # KpiCard, DataTable, Charts
│   └── feedback/       # Toast, Modal, EmptyState
├── lib/
│   ├── api/            # Axios wrappers per domain
│   ├── hooks/          # React Query + custom hooks
│   ├── stores/         # Zustand (cart, auth, UI)
│   ├── socket/         # Socket.io client
│   └── utils/          # cn(), money formatting
└── middleware.ts       # Auth guards, role redirects
```

## Rendering Strategy

| Page | Rendering | Reason |
|------|-----------|--------|
| Home | SSR | SEO, featured products |
| Catalog | SSR | SEO, search params |
| Product Detail | SSR | SEO, seller info |
| Cart / Checkout | CSR | Interactive, user-specific |
| Orders / Returns | CSR | Authenticated |
| Seller Dashboard | CSR | Authenticated, data-heavy |
| Admin Panel | CSR | Authenticated, operational |

## Design System

- **Tailwind CSS** with custom Crochet Hub theme colors
- **shadcn/ui** component library (not yet installed — Branch 6+)
- **Light/Dark mode** via CSS variables + `next-themes`
- **Responsive:** Mobile-first, breakpoints at sm/md/lg/xl

## Testing

```bash
pnpm test:e2e                    # Run Playwright tests
npx playwright test --headed     # Run with browser visible
npx playwright show-report       # View HTML report
```

## E2E Tests

| File | Coverage |
|------|----------|
| `health.spec.ts` | Frontend loads, API health check |
| `auth.spec.ts` | Register, login, protected routes, token refresh |
| `catalog.spec.ts` | Product listing, search, filter, detail, categories |
| `seller-onboarding.spec.ts` | Seller registration, admin approval |
