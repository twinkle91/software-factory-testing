# AGENTS.md — Factory Floor Manual for MemoFlow

Every Mastra Factory agent working in this repository must follow these rules.
1. Read the rulebook first: `MISSION.md` for boundaries; `architecture.md` for APIs and storage; `conventions.md` for TypeScript and tests; `design.md` and `.storybook/` for visual references; `harness/harness.config.json` for commands and protected paths.
2. Before opening a PR run `npm run check`, `npm run lint`, `npm run test`, and `npm run build`. UI changes also require `npm run build-storybook` and the applicable public browser journeys.
3. Never modify `MISSION.md`, `AGENTS.md`, `architecture.md`, `conventions.md`, `design.md`, `quality.md`, `harness/**`, `.factory/**`, `.storybook/**`, `package.json`, `package-lock.json`, `vitest.config.ts`, or `biome.json`. Never delete or weaken existing unit tests in `src/**/*.test.ts`. These are human-owned harness files; new test coverage for an app change is allowed.
4. If conflicting code comments, unclear permission rules, or ambiguous requirements prevent a reliable decision, output `STATUS: NEEDS_CLARIFICATION` followed by a `QUESTIONS:` list. The workflow must pause for human input.
5. Log unrelated bugs in the `discoveries` output list so a separate ticket is created. Do not fix them in the same PR.
6. Use only the target repository. Factory configuration and private verification inputs are outside this repository and outside your access scope.
7. Runtime notes, actions, and feedback belong in the JSON store. Never commit user database state, credentials, `.env.local`, or generated build artifacts.

The trusted initial bootstrap creates this rulebook and the harness before the baseline commit. Subsequent Factory-generated application changes must obey the protected paths above.
