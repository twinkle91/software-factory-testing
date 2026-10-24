# Public browser journeys

Run against a fresh initialized database. The app must report healthy status and its supplied runtime GIT_COMMIT_SHA before testing. Do not infer CSV record counts from physical lines: a quoted field contains an embedded newline.

## Journey 1: Note creation and reload persistence

1. Open MemoFlow and click **New note**.
2. Fill **Note title** with `Q4 Architecture Review`.
3. Fill **Note body** with `Verify Mastra Sandbox isolation`.
4. Click **Create note**. Verify the note title and body are visible.
5. Reload the browser. Confirm both title and body remain visible.

## Journey 2: Action selection and CSV export

1. Select the checkboxes named **Select item-1** and **Select item-2**.
2. Click **Export Selected to CSV**.
3. Verify a download named `memoflow-actions.csv`.
4. Parse the file as RFC 4180 CSV. Verify the header and exactly two data records with non-empty fields matching the selected items.

## Journey 3: Feedback widget

1. Fill **Share feedback** with `Add keyboard shortcut Cmd+K for search`.
2. Click **Submit feedback**.
3. Confirm `POST /api/feedback` returns 201 Created.
4. Confirm the visible acknowledgment, `Thanks! Your feedback is saved.` The acknowledgment means durable acceptance even if Factory is temporarily offline.
