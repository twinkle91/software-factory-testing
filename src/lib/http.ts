import { WORKSPACE_ID } from "./types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function jsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 30_000) throw new HttpError(413, "Request is too large.");
  try {
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Send a valid JSON object.");
  }
}

export function requiredText(
  value: unknown,
  name: string,
  maximum: number,
): string {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new HttpError(400, `${name} must contain 1–${maximum} characters.`);
  }
  return value.trim();
}

export function authorizeWorkspace(workspace: unknown) {
  // This single-workspace demo identity is resolved on the server, never from request input.
  if (workspace !== undefined && workspace !== WORKSPACE_ID) {
    throw new HttpError(403, "This demo identity can access Team Alpha only.");
  }
  return WORKSPACE_ID;
}

export function apiError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("MemoFlow request failed", error);
  return Response.json(
    { error: "Unable to save or load data. Please try again." },
    { status: 500 },
  );
}
