import {
  apiError,
  authorizeWorkspace,
  HttpError,
  jsonBody,
  requiredText,
} from "@/lib/http";
import { readDatabase, updateDatabase } from "@/lib/store";
import { STATUSES, type Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workspace = authorizeWorkspace(
      new URL(request.url).searchParams.get("workspaceId") ?? undefined,
    );
    const database = await readDatabase();
    return Response.json({
      items: database.actionItems.filter(
        (item) => item.workspace_id === workspace,
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await jsonBody(request);
    const workspace = authorizeWorkspace(body.currentWorkspaceId);
    const id = requiredText(body.id, "Item ID", 200);
    const owner = requiredText(body.owner, "Owner", 100);
    if (!STATUSES.includes(body.status as Status))
      throw new HttpError(400, "Choose a valid status.");
    const item = await updateDatabase((database) => {
      const item = database.actionItems.find(
        (entry) => entry.id === id && entry.workspace_id === workspace,
      );
      if (!item) throw new HttpError(404, "Action item not found.");
      item.owner = owner;
      item.status = body.status as Status;
      return item;
    });
    return Response.json({ item });
  } catch (error) {
    return apiError(error);
  }
}
