# React + Vite

## Local CMS demo

Run `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm demo:seed`, then start `pnpm demo:preview`. Open http://localhost:4173/admin and sign in with `demo` / `demo-only`.

The demo uses only `.dev-preview/data` and `.dev-preview/uploads`. Its fictional tracks, generated audio, covers, and analytics never use the normal CMS database or uploaded files. Seeding refuses an existing demo database; it will not overwrite data. To make a fresh demo, remove the isolated `.dev-preview` directory after confirming its path.

The new analytics table is additive. Historical rows in `plays` remain play starts and cannot be turned into meaningful-listen history. Before deploying to a VPS, identify its active `CMS_DATA_DIR` and upload directory, make a verified SQLite online backup and an uploads archive, and test the migration on a copy. Do not replace those directories during deployment.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
