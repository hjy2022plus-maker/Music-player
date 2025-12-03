# Repository Guidelines

## Project Structure & Module Organization
- Root entry `index.tsx` mounts `App.tsx`; UI lives in `components/` (e.g., `Sidebar.tsx`, `MainView.tsx`, `PlayerBar.tsx`, `AlbumCard.tsx`, `SongRow.tsx`).
- Shared shapes are in `types.ts`; theme tokens and mock catalog sit in `constants.ts`.
- AI playlist generation stays in `services/geminiService.ts`; keep network logic isolated here.
- Secrets belong in `.env.local` (ignored by Git) and feed Vite; `index.html` hosts the root container and metadata.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 18+ recommended).
- `npm run dev` — start the Vite dev server at http://localhost:5173/ with HMR.
- `npm run build` — create the production bundle in `dist/`.
- `npm run preview` — serve the built bundle locally for sanity checks.

## Coding Style & Naming Conventions
- TypeScript + React function components; prefer hooks and keep view-specific state local.
- Formatting: single quotes, semicolons, 2-space indentation, file-level PascalCase for components, camelCase for functions/vars, shared constants in SCREAMING_SNAKE_CASE.
- Styling lives in utility className strings; avoid inline styles unless necessary.

## Testing Guidelines
- No runner is configured yet; when adding tests, use Vitest + React Testing Library and name specs `*.test.tsx` mirroring `components/` (e.g., `components/__tests__/Sidebar.test.tsx`).
- Cover UI states (empty/loading/playing) and service error handling; document any new npm scripts (e.g., `npm run test`).

## Commit & Pull Request Guidelines
- Commits: concise, imperative subjects (e.g., `Add album details view`); group related changes and avoid mixing refactors with features.
- PRs: include a summary, user-facing screenshots for UI changes, reproduction steps, and linked issues/trackers.
- Note any new environment variables (service expects `process.env.API_KEY`; `.env.local` currently uses `GEMINI_API_KEY`—set both or align naming) and update docs when behavior changes.

## Security & Configuration Tips
- Never commit secrets; scope keys to least privilege and validate API keys before enabling AI features.
- Keep remote assets over HTTPS and handle player/network failures gracefully; log only non-sensitive context.
