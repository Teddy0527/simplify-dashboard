# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start Vite dev server (port 3001)
npm run build        # tsc && vite build (typecheck + production build)
npm run type-check   # TypeScript check only (no emit)
npm run preview      # Preview production build
```

No test runner is configured.

## Git Workflow (Worktree)

新機能開発はgit worktreeで行う。`/worktree`コマンドで作成。
- mainブランチは直接変更しない
- 各worktreeで独立したブランチを切って作業
- 完了後はPRでmainにマージ

## Architecture

**Monorepo** with two packages:
- `packages/shared/` — TypeScript library: types, repository layer, storage adapters, utilities. Imported as `@jobsimplify/shared`.
- `src/` — React 18 + Vite dashboard application.

**Stack**: React 18, react-router-dom v7, Vite 5, TypeScript 5 (strict), Tailwind CSS 3, Supabase, @dnd-kit, Recharts.

### Routing (`src/routes.tsx`)

- `/` — TrackerPage (Kanban + Calendar views)
- `/profile` — ProfilePage
- `/admin` — AdminPage
- `/onboarding` — OnboardingWizardPage (outside DashboardLayout)

Pages are lazy-loaded with Suspense. `DashboardLayout` wraps main routes with `ToastProvider` + `OnboardingProvider`.

### Data Layer

**Repository pattern** in `packages/shared/src/repositories/`. Each repository uses Supabase when authenticated, falls back to localStorage (or Chrome extension storage) when not.

**Type conversions**: DB uses `snake_case`, app uses `camelCase`. Mappers are in `packages/shared/src/types/database.ts`.

**Optimistic updates**: UI changes immediately via `setState`, then persists to DB asynchronously. Pattern used throughout `useCompanies` and Kanban operations.

### State Management

- `AuthProvider` (Context) — Supabase auth with Google OAuth
- `useCompanies()` — main data hook with optimistic updates
- `OnboardingContext` — A/B testing variants + checklist tracking
- `ToastProvider` — notification queue
- No Redux/Zustand; all state via Context + hooks

### Path Aliases

- `@/` → `src/`
- `@jobsimplify/shared` → `packages/shared/src`

### Environment Variables

Required in `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Design Rules (DESIGN_PROTOCOL.md)

- **Fonts**: Inter + Noto Sans JP only. No serif.
- **Colors**: Navy primary (`--color-primary-700: #334E68`) + gray palette. No cream backgrounds.
- **Border radius**: 8px buttons/inputs (`rounded-lg`), 12px cards (`rounded-xl`), 16px modals (`rounded-2xl`)
- **Shadows**: `shadow-sm` standard, `shadow-md` on hover
- **Custom CSS classes**: `btn-primary`, `btn-secondary`, `btn-ghost`, `input-field`, `select-field`, `card`, `status-badge` — defined in `src/styles/global.css`
- **CSS variables**: Google Calendar vars (`--gcal-*`), primary/gray/semantic colors — all in `global.css :root`

## Language

Commit messages and UI text are in Japanese. Code (variables, comments) is in English.

## Build Notes

- `tsconfig.json` has `noUnusedLocals` + `noUnusedParameters` enabled
- Vite config drops `console.log` and `debugger` in production
- Manual chunks: vendor, router, dndkit, supabase (chunk warning at 500KB)
