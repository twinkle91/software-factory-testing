import { randomUUID } from "node:crypto";
import { deliverPendingFeedback } from "@/lib/feedback";
import {
  apiError,
  authorizeWorkspace,
  jsonBody,
  requiredText,
} from "@/lib/http";
import { updateDatabase } from "@/lib/store";
import type { Feedback } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await jsonBody(request);
    const now = new Date().toISOString();
    const feedback: Feedback = {
      id: randomUUID(),
      message: requiredText(body.message, "Feedback", 5000),
      workspace_id: authorizeWorkspace(body.currentWorkspaceId),
      createdAt: now,
      delivery: { status: "pending", attempts: 0, nextAttemptAt: now },
    };
    await updateDatabase((database) => database.feedback.push(feedback));
    await deliverPendingFeedback(feedback.id).catch((error) =>
      console.error("Feedback delivery deferred", error),
    );
    return Response.json(
      { id: feedback.id, status: "accepted" },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
