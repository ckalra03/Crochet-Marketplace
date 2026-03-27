# Branch 19: `feature/fe-shadcn-components` — UI Component Library Completion

**Date:** 2026-03-27 | **Commits:** 1

## What Was Built

Installed all remaining shadcn/ui components needed across the application. The project previously had only 5 UI components (badge, button, card, input, label). This branch adds 28 more components, bringing the total to 33.

## Components Added

### Form Components
| Component | File | Radix Package | Purpose |
|-----------|------|---------------|---------|
| Select | `select.tsx` | `@radix-ui/react-select` | Dropdown selection for filters, forms |
| Checkbox | `checkbox.tsx` | `@radix-ui/react-checkbox` | Multi-select options, terms agreement |
| RadioGroup | `radio-group.tsx` | `@radix-ui/react-radio-group` | Single-select options (approval actions) |
| Textarea | `textarea.tsx` | Native HTML | Multi-line text input |
| Slider | `slider.tsx` | `@radix-ui/react-slider` | Price range filter, budget selector |
| Switch | `switch.tsx` | `@radix-ui/react-switch` | Toggle settings |
| Calendar | `calendar.tsx` | `react-day-picker` v9 | Date pickers in filters and forms |
| Command | `command.tsx` | `cmdk` | Command palette, combobox search |

### Data Display Components
| Component | File | Purpose |
|-----------|------|---------|
| Table | `table.tsx` | Data tables across all dashboards |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Avatar | `avatar.tsx` | User and seller profile pictures |
| Separator | `separator.tsx` | Visual dividers |
| Progress | `progress.tsx` | Progress bars (upload, payout cycle) |
| AspectRatio | `aspect-ratio.tsx` | Image containers with fixed ratios |

### Layout & Navigation
| Component | File | Purpose |
|-----------|------|---------|
| Tabs | `tabs.tsx` | Tab navigation (order status, product form) |
| Accordion | `accordion.tsx` | Collapsible sections (filters, FAQ) |
| ScrollArea | `scroll-area.tsx` | Custom scrollable containers |
| Breadcrumb | `breadcrumb.tsx` | Navigation breadcrumbs on detail pages |
| Pagination | `pagination.tsx` | Page navigation for lists |

### Overlays & Feedback
| Component | File | Purpose |
|-----------|------|---------|
| Dialog | `dialog.tsx` | Modals (forms, confirmations) |
| AlertDialog | `alert-dialog.tsx` | Destructive action confirmations |
| Sheet | `sheet.tsx` | Slide-out panels (mobile menu, cart drawer) |
| Popover | `popover.tsx` | Floating content (date picker, filter) |
| Tooltip | `tooltip.tsx` | Hover information |
| DropdownMenu | `dropdown-menu.tsx` | Action menus |
| HoverCard | `hover-card.tsx` | Rich hover previews |
| Alert | `alert.tsx` | Inline alert messages |
| Toast | `toast.tsx` | Re-exports Sonner toast function |

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-accordion` | ^1.x | Accordion primitive |
| `@radix-ui/react-alert-dialog` | ^1.x | Alert dialog primitive |
| `@radix-ui/react-aspect-ratio` | ^1.x | Aspect ratio primitive |
| `@radix-ui/react-hover-card` | ^1.x | Hover card primitive |
| `@radix-ui/react-progress` | ^1.x | Progress bar primitive |
| `@radix-ui/react-radio-group` | ^1.x | Radio group primitive |
| `@radix-ui/react-scroll-area` | ^1.x | Scroll area primitive |
| `@radix-ui/react-slider` | ^1.x | Slider primitive |
| `@radix-ui/react-switch` | ^1.x | Switch primitive |
| `@tanstack/react-table` | ^8.x | Headless table (used in Branch 23) |
| `cmdk` | ^1.x | Command menu primitive |
| `date-fns` | ^3.x | Date utility library |
| `react-day-picker` | ^9.x | Calendar/date picker |

## Architecture Decisions

- **All components use `forwardRef`** for consistent ref forwarding
- **All components have `displayName`** for React DevTools debugging
- **`cn()` utility** used everywhere for className merging (clsx + tailwind-merge)
- **Calendar uses react-day-picker v9 API** (Chevron component instead of v8 IconLeft/IconRight)
- **Toast re-exports Sonner** rather than using Radix Toast directly (Sonner is already the project's toast system)

## How to Verify

```bash
# TypeScript check — should show zero errors
cd apps/web && npx tsc --noEmit

# All 33 component files should exist
ls src/components/ui/ | wc -l  # Should be 33
```

## Key Files

All files in `apps/web/src/components/ui/`:
- `table.tsx`, `textarea.tsx`, `skeleton.tsx`, `separator.tsx`, `switch.tsx`, `progress.tsx`, `scroll-area.tsx`
- `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `slider.tsx`, `calendar.tsx`, `command.tsx`, `alert.tsx`
- `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `popover.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`, `hover-card.tsx`
- `tabs.tsx`, `accordion.tsx`, `avatar.tsx`, `aspect-ratio.tsx`, `pagination.tsx`, `breadcrumb.tsx`, `toast.tsx`
