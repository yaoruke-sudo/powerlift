# PowerLift Agent Notes

This repository is a PowerLift training tracker built with React, TypeScript, Vite, Tailwind CSS, Capacitor Android, and a retained FastAPI/Supabase backend.

Before changing code, read [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md). For Git expectations, read [docs/GIT_GUIDE.md](docs/GIT_GUIDE.md).

## Working Rules

- Treat `App.tsx` as the current navigation coordinator. The app does not use React Router.
- Keep UI-facing data contracts aligned with `types.ts`.
- Prefer changing `services/api.ts` for feature-level data behavior and `services/db.ts` only for IndexedDB persistence details.
- The active frontend data path is local IndexedDB: `pages/*` -> `services/api.ts` -> `services/db.ts`.
- The `backend/` FastAPI/Supabase code is currently retained as a cloud/backend option, not the default runtime path for the Vite app.
- Run `npm run build` before finishing meaningful frontend changes.
- If Android assets or Capacitor config change, also consider `npx cap sync android`.
- Never commit `.env`, `.env.local`, `node_modules/`, `dist/`, logs, or local Codex/plugin tooling.
- Check `git status --short --branch` before editing and before committing so user changes are not accidentally mixed or overwritten.

