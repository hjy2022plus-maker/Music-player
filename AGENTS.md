# Repository Guidelines

## Project Structure & Module Organization
- Vite React + TypeScript app; entry `src/main.tsx` mounts `App.tsx` at `#root`.
- UI is split into `components/` (Sidebar, PlayerBar, MainView, QueueList, FullScreenPlayer, AlbumCard, SongRow) with shared types in `types.ts`.
- Config/constants live in `constants.ts`; mock API is in `mock/` and used by the dev script. Assets sit in `covers/` and `music/`; built output goes to `dist/` and should not be edited manually.

## Build, Test, and Development Commands
- `npm install` ！ install dependencies (run once or after lockfile changes).
- `npm run dev -- --host --port 5173` ！ start Vite dev server (match `DEV_PORT` if overridden).
- `npm run mock` ！ start the mock API (default `MOCK_PORT=4000`); keep it running for data to load.
- `start-dev.bat` ！ Windows helper that launches both mock + dev servers; respects `MOCK_PORT`/`DEV_PORT` env vars.
- `npm run build` ！ production build to `dist/`; `npm run preview` serves the built assets for a final check.

## Coding Style & Naming Conventions
- Stick to functional React with hooks and typed props; avoid implicit `any` and prefer the interfaces/enums in `types.ts`.
- 2-space indentation, semicolons, and PascalCase component files; functions/variables camelCase; enums PascalCase.
- Use Tailwind utility classes in `className`; keep additional CSS in `src/index.css`. Keep asset paths relative to `music/` and `covers/` and update mocks when they change.

## Testing Guidelines
- No automated suite yet: run `npm run dev` + `npm run mock`, then smoke-test playback (play/pause, seek, volume), queue add/remove, full-screen toggle, and navigation tabs.
- When adding tests, favor React Testing Library with Vitest; co-locate specs as `*.test.tsx` beside the component.

## Commit & Pull Request Guidelines
- Commits: short, imperative subjects (e.g., `Add queue keyboard shortcuts`); group related changes; keep lockfile updates with the dependency change.
- PRs: include a concise summary, linked issue if available, before/after UI screenshots for visual tweaks, and call out new env vars or manual test steps.

## Security & Configuration
- Secrets and service URLs belong in `.env.local`; do not commit credentials or unlicensed media.
- Exclude `dist/` and `node_modules/` from PRs; reinstall deps after Node upgrades (Vite/TypeScript expect modern Node 18+).
