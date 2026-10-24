import { randomUUID } from "node:crypto";
import {
  apiError,
  authorizeWorkspace,
  jsonBody,
  requiredText,
} from "@/lib/http";
import { readDatabase, updateDatabase } from "@/lib/store";
import type { Note } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workspace = authorizeWorkspace(
      new URL(request.url).searchParams.get("workspaceId") ?? undefined,
    );
    const database = await readDatabase();
    return Response.json({
      notes: database.notes.filter((note) => note.workspace_id === workspace),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await jsonBody(request);
    const workspace = authorizeWorkspace(body.currentWorkspaceId);
    const note: Note = {
      id: randomUUID(),
      workspace_id: workspace,
      title: requiredText(body.title, "Title", 180),
      body: requiredText(body.body, "Body", 20_000),
      createdAt: new Date().toISOString(),
    };
    await updateDatabase((database) => database.notes.unshift(note));
    return Response.json({ note }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
