import { apiError, authorizeWorkspace, HttpError, jsonBody } from "@/lib/http";
import { readDatabase } from "@/lib/store";
import { formatActionItemsCsv } from "@/utils/exportCsv";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await jsonBody(request);
    const workspace = authorizeWorkspace(body.currentWorkspaceId);
    if (
      !Array.isArray(body.selectedIds) ||
      body.selectedIds.length === 0 ||
      body.selectedIds.length > 1000 ||
      body.selectedIds.some((id) => typeof id !== "string" || id.length > 200)
    ) {
      throw new HttpError(400, "Select at least one action item to export.");
    }
    const database = await readDatabase();
    const permitted = database.actionItems.filter(
      (item) => item.workspace_id === workspace,
    );
    if (
      !permitted.some((item) =>
        (body.selectedIds as string[]).includes(item.id),
      )
    ) {
      throw new HttpError(
        400,
        "No selected action items are available in your workspace.",
      );
    }
    return new Response(
      formatActionItemsCsv(permitted, body.selectedIds, workspace),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="memoflow-actions.csv"',
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
