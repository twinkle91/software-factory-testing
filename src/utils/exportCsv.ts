import type { ActionItem } from "../lib/types";

export const CSV_HEADER = "id,title,owner,status,workspace_id";

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function formatActionItemsCsv(
  items: ActionItem[],
  selectedIds: string[],
  currentWorkspaceId: string,
): string {
  if (process.env.SIMULATE_EMPTY_CSV_FAULT === "true")
    return `${CSV_HEADER}\r\n`;
  const selected = new Set(selectedIds);
  const rows = items
    .filter(
      (item) =>
        selected.has(item.id) && item.workspace_id === currentWorkspaceId,
    )
    .map((item) =>
      [item.id, item.title, item.owner, item.status, item.workspace_id]
        .map(escapeCsv)
        .join(","),
    );
  return `${[CSV_HEADER, ...rows].join("\r\n")}\r\n`;
}
