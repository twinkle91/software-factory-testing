# Conventions

- Use strict TypeScript; prefer native platform features and existing libraries to new abstractions.
- Validate every request boundary. A client workspace field never authorizes access.
- Use the shared store for writes; never write db.json directly from a route.
- Return useful JSON errors; never report success before data is persisted.
- Keep CSV behavior in `src/utils/exportCsv.ts`; quote fields containing commas, quotes, CR, or LF, double embedded quotes, and separate records with CRLF.
- Render Markdown with react-markdown without raw HTML support.
- Preserve accessible names, semantic controls, keyboard use, focus indication, reduced-motion behavior, and the native modal focus trap.
- Unit and integration tests use Vitest with isolated temporary databases. Exercise actual routes, persistence, permissions, CSV, and a real local webhook receiver.
- Before a PR, run check, lint, test, build, and build-storybook. Biome formats and checks source; `npm run format` applies local formatting.
- Log unrelated bugs as discoveries; keep one issue's implementation focused.
