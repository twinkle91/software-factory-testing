# Architecture

MemoFlow uses Next.js App Router, React, TypeScript, Tailwind CSS, and a Node.js file-backed database. Run one Node server process with one writable persistent data volume. `data/db.json` initializes from `data/seed.json` when absent. `MEMOFLOW_DATA_FILE` can select an absolute persistent file location. Mutations serialize in process and write to a temporary file before atomic rename. Never reset a database on parse errors; preserve it for recovery. Multiple processes require replacing the store with SQLite or another database.

## Boundaries

- `src/app/page.tsx`: server-side workspace filtering and initial rendering.
- `src/components/MemoFlow.tsx`: accessible note creation, Markdown display, search, action selection, owner/status editing, CSV download, and feedback.
- `src/lib/store.ts`: serialized, atomic file persistence.
- `src/lib/http.ts`: request validation and server-owned workspace authorization.
- `src/utils/exportCsv.ts`: selected-row, workspace-filtered RFC 4180 export. Keep its exported `formatActionItemsCsv(items, selectedIds, currentWorkspaceId)` contract stable.
- `src/lib/feedback.ts`: durable feedback outbox and retry worker registered by `src/instrumentation.ts`.

The single demo identity is explicitly fixed to `team-alpha` on the server. A supplied workspace ID can never grant access. A different supplied workspace ID returns 403; restricted selected IDs are filtered. `restricted-org` data must never reach the browser or API response. This demo has no login; add a real server-resolved session before exposing other workspaces.

## HTTP contracts

All mutations accept JSON objects. Errors use `{ "error": "human-readable message" }` with 400 for invalid input, 403 for workspace denial, 404 for unavailable items, and 500 for storage failures.

| Route                     | Contract                                                                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`         | `{ status: "ok", timestamp }`; no cache                                                                                                                                          |
| `GET /api/build-id`       | `{ commitSha: process.env.GIT_COMMIT_SHA                                                                                                                                         |     | "HEAD-LOCAL" }`; read at runtime, no cache |
| `GET /api/notes`          | `{ notes }`, Team Alpha only; optional `?workspaceId=team-alpha`                                                                                                                 |
| `POST /api/notes`         | `{ title, body, currentWorkspaceId? }`; 201 `{ note }`; title 1–180 chars, body 1–20000                                                                                          |
| `GET /api/action-items`   | `{ items }`, Team Alpha only; optional workspace query as above                                                                                                                  |
| `PATCH /api/action-items` | `{ id, owner, status, currentWorkspaceId? }`; 200 `{ item }`; owner 1–100 chars; status `To do`, `In progress`, or `Done`                                                        |
| `POST /api/export-csv`    | `{ selectedIds: string[], currentWorkspaceId? }`; downloadable `text/csv`, CRLF records, comma/quote/newline escaping; empty selection or no permitted selected rows returns 400 |
| `POST /api/feedback`      | `{ message, currentWorkspaceId? }`; 201 `{ id, status: "accepted" }` after durable write; message 1–5000 chars                                                                   |

CSV columns: `id,title,owner,status,workspace_id`. Duplicate selected IDs do not duplicate rows. `SIMULATE_EMPTY_CSV_FAULT=true` deliberately returns only the CSV header for Factory calibration; keep unset or false in ordinary operation.

## Feedback delivery

`FACTORY_WEBHOOK_URL` points to `http://127.0.0.1:4111/webhooks/intake`. Mastra reserves `/api/*` for its internal router, so the custom Factory intake route is `/webhooks/intake`. Set optional `FACTORY_INTAKE_TOKEN` to the same secret configured in Factory; it is sent only in the Authorization Bearer header. Feedback is stored before attempting delivery. On failure the outbox survives server restart and retries every five seconds with exponential backoff (maximum five minutes). No webhook configured means the pending record remains durable until configuration is supplied.

The webhook carries `{ eventId, source: "memoflow", type: "feedback", title, description, message, feedbackId, createdAt }`. Its stable event ID is also sent in `Idempotency-Key`. Delivery is at least once; Factory must deduplicate that stable ID because a crash after receipt and before acknowledgment persistence can repeat delivery.

## Commands

Use Node 22.13+ and `npm ci`. `npm run dev` starts development on port 3000. `npm run build` compiles production; `npm start -- --hostname 0.0.0.0 --port 3000` serves it. Supply `GIT_COMMIT_SHA` at runtime for independent identity verification. `npm run build-storybook` compiles component references; `npm run storybook` serves them on 6006. Required checks are `npm run check`, `npm run lint`, `npm run test`, and `npm run build`.
