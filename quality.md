# Feature quality report

| Feature             | Baseline              | Evidence and remaining boundary                                                                                                      |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Notes               | A                     | Durable atomic writes, Markdown rendering without raw HTML, title/body validation, create/reload journey                             |
| Action items        | A                     | Persistent owner/status edits, text/status filters, keyboard-accessible selection                                                    |
| CSV export          | A                     | Selected rows, RFC 4180 escaping, CRLF records, empty-selection validation, server-owned workspace scope                             |
| Workspace isolation | A for single identity | Server restricts every data route and initial page props to Team Alpha; real login is outside demo scope                             |
| Feedback            | A                     | Durable outbox, stable event IDs, authenticated optional webhook, restart-safe retries; receiver deduplicates delivery               |
| Visual reference    | A                     | NoteCard and ExportCsvButton component states compile in Storybook                                                                   |
| Persistence scale   | B                     | Atomic serialized JSON is for one server process; migrate to SQLite before horizontal scaling                                        |
| Accessibility       | B                     | Semantic controls, named inputs, dialog focus trap, live status/errors, responsive layout; manual screen reader audit remains useful |

Idle quality work should strengthen this product within MISSION.md boundaries. Each proposed change needs concrete evidence and its own ticket. Never convert this report into permission for unrelated scope expansion.
