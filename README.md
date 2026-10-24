# MemoFlow

A working Next.js target application for the AI Software Factory blueprint. Start with `MISSION.md`, `architecture.md`, `design.md`, and the public journeys in `harness/END-TO-END.md`.

```sh
npm ci
cp .env.example .env.local
npm run build
npm start -- --hostname 0.0.0.0 --port 3000
```

Use Node 22.13 or newer. The database initializes from the committed seed on first access. To reset a disposable demo instance, stop the server, back up and remove `data/db.json`, then restart. Never reset a shared running instance. Configure the Factory webhook URL and matching optional token in `.env.local`. Pending feedback survives restarts.

```sh
npm run check
npm run lint
npm run test
npm run build
npm run build-storybook
```

`npm run dev` serves development on port 3000. `npm run storybook` serves component references on 6006. Supply `GIT_COMMIT_SHA` in the running server environment; `/api/build-id` reports it without caching. Calibration may set `SIMULATE_EMPTY_CSV_FAULT=true`; ordinary operation must leave that flag false.
