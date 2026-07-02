# PaperTech Desktop Shell

This folder contains the Electron main and preload processes.

- `main.cjs` creates the native desktop window, blocks unsafe navigation, and disables developer tools in production.
- `preload.cjs` exposes a small, context-isolated IPC bridge under `window.papertechDesktop`.
- `updates:check` is intentionally stubbed so a signed auto-update provider can be added later without changing the renderer contract.

Development flow:

1. Run `npm run dev` in one terminal.
2. Run `npm run electron:dev` in another terminal.

Production build:

1. Run `npm run desktop:build`.
