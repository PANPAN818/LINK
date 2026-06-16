# Link Project Instructions

- Project scaffolded as Vue 3 + Vite + TypeScript + PWA.
- Keep the app mobile-first for Android/iOS browsers and installable PWA use.
- Keep features split by page/component/service/store/data/type modules; do not pile UI and business logic into a single file.
- Persist app data in IndexedDB through `src/data/db.ts`.
- Treat user IDs and character IDs as QQ-like account numbers.
- Online chat and offline RP are the same conversation with different renderers and prompt mode.
- World books are scoped as online global, offline global, and local role-bound entries.
- README is the project usage reference.
