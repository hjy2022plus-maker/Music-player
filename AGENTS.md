# Repository Guidelines

## Project Structure & Module Organization
- Root entry is `index.tsx` mounting `App.tsx`; UI pieces live in `components/` (e.g., `Sidebar.tsx`, `MainView.tsx`, `PlayerBar.tsx`, `AlbumCard.tsx`, `SongRow.tsx`).
- Domain shapes are in `types.ts`; shared theme tokens and mock catalog live in `constants.ts`.
- AI playlist generation is isolated in `services/geminiService.ts` (Google GenAI client); keep network logic here.
- `.env.local` holds secrets (ignored by Git) and feeds Vite; `index.html` hosts the root container and metadata.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 18+ recommended).
- `npm run dev` — start Vite dev server with hot reload on http://localhost:5173/.
- `npm run build` — production bundle to `dist/`.
- `npm run preview` — serve the built bundle locally for sanity checks.

## Coding Style & Naming Conventions
- TypeScript + React function components; prefer hooks over classes and keep state local to view-specific components.
- Use single quotes, semicolons, and 2-space indentation consistent with existing files.
- Components/files in PascalCase, variables/functions in camelCase, exported constants in SCREAMING_SNAKE_CASE when shared.
- Co-locate view logic in `components/`; keep data fetching and AI calls in `services/` and shared values in `constants.ts`.
- Utility-first styling is embedded via className strings (Tailwind-like tokens); avoid inline styles unless necessary.

## Testing Guidelines
- No test runner is configured yet; when adding tests, prefer Vitest + React Testing Library, name specs `*.test.tsx`, and mirror the source tree (e.g., `components/__tests__/Sidebar.test.tsx`).
- Aim to cover UI states (empty/loading/playing) and service error handling; document any new npm scripts (e.g., `npm run test`).

## Commit & Pull Request Guidelines
- Write concise, imperative commit subjects (e.g., `Add album details view`); group related changes and avoid mixing refactors with feature work.
- PRs should include a summary, user-facing screenshots for UI changes, reproduction steps, and linked issues/trackers.
- Note any new environment variables (service expects `process.env.API_KEY`; `.env.local` currently uses `GEMINI_API_KEY`—set both or align naming) and update docs when behavior changes.

## Security & Configuration Tips
- Never commit secrets; use `.env.local` and keep keys scoped to least privilege.
- Validate API keys before enabling AI features; log only non-sensitive context.
- If adding remote assets, prefer HTTPS sources and handle failures gracefully in the player.
