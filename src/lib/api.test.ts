import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getItems,
  PATCH as patchItem,
} from "../app/api/action-items/route";
import { GET as getBuildId } from "../app/api/build-id/route";
import { POST as exportCsv } from "../app/api/export-csv/route";
import { POST as postFeedback } from "../app/api/feedback/route";
import { GET as getNotes, POST as postNote } from "../app/api/notes/route";
import { deliverPendingFeedback } from "./feedback";
import { readDatabase, updateDatabase } from "./store";

let directory = "";
let server: Server | undefined;

function post(url: string, body: unknown, method = "POST") {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "memoflow-test-"));
  vi.stubEnv("MEMOFLOW_DATA_FILE", path.join(directory, "db.json"));
  vi.stubEnv("FACTORY_WEBHOOK_URL", "");
  vi.stubEnv("SIMULATE_EMPTY_CSV_FAULT", "false");
});

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) =>
      server?.close((error) => (error ? reject(error) : resolve())),
    );
    server = undefined;
  }
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

describe("MemoFlow API and persistence", () => {
  it("persists notes and serializes concurrent writes without losing existing data", async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        postNote(
          post("/api/notes", {
            title: `Note ${index}`,
            body: "Verify Mastra Sandbox isolation",
          }),
        ),
      ),
    );
    expect(responses.every((response) => response.status === 201)).toBe(true);
    const response = await getNotes(new Request("http://localhost/api/notes"));
    const { notes } = await response.json();
    expect(notes).toHaveLength(9);
    expect(
      JSON.parse(await readFile(path.join(directory, "db.json"), "utf8")).notes,
    ).toHaveLength(9);
    expect((await readDatabase()).actionItems).toHaveLength(3);
  });

  it("rejects malformed input and workspace tampering across all data routes", async () => {
    expect(
      (await postNote(post("/api/notes", { title: "", body: "Hello" }))).status,
    ).toBe(400);
    expect(
      (
        await postNote(
          post("/api/notes", {
            title: "Note",
            body: "Hello",
            currentWorkspaceId: "restricted-org",
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await getNotes(
          new Request("http://localhost/api/notes?workspaceId=restricted-org"),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await getItems(
          new Request(
            "http://localhost/api/action-items?workspaceId=restricted-org",
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await exportCsv(
          post("/api/export-csv", {
            selectedIds: ["item-3"],
            currentWorkspaceId: "restricted-org",
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await patchItem(
          post(
            "/api/action-items",
            { id: "item-3", owner: "Alex", status: "Done" },
            "PATCH",
          ),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await postFeedback(
          post("/api/feedback", {
            message: "Hello",
            currentWorkspaceId: "restricted-org",
          }),
        )
      ).status,
    ).toBe(403);
    const items = await (
      await getItems(new Request("http://localhost/api/action-items"))
    ).json();
    expect(items.items.map((item: { id: string }) => item.id)).toEqual([
      "item-1",
      "item-2",
    ]);
  });

  it("handles empty export cleanly and never exports another workspace's rows", async () => {
    expect(
      (await exportCsv(post("/api/export-csv", { selectedIds: [] }))).status,
    ).toBe(400);
    const response = await exportCsv(
      post("/api/export-csv", {
        selectedIds: ["item-1", "item-3"],
        currentWorkspaceId: "team-alpha",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain(
      "memoflow-actions.csv",
    );
    const csv = await response.text();
    expect(csv).toContain("item-1");
    expect(csv).not.toContain("item-3");
    expect(csv).not.toContain("Secret");
  });

  it("persists owner and status edits and rejects invalid statuses", async () => {
    expect(
      (
        await patchItem(
          post(
            "/api/action-items",
            { id: "item-1", owner: "Taylor", status: "Done" },
            "PATCH",
          ),
        )
      ).status,
    ).toBe(200);
    expect((await readDatabase()).actionItems[0]).toMatchObject({
      owner: "Taylor",
      status: "Done",
    });
    expect(
      (
        await patchItem(
          post(
            "/api/action-items",
            { id: "item-1", owner: "Taylor", status: "Invalid" },
            "PATCH",
          ),
        )
      ).status,
    ).toBe(400);
  });

  it("durably accepts feedback during outages and retries with a stable authenticated event ID", async () => {
    const received: {
      headers: Record<string, string | string[] | undefined>;
      body: string;
    }[] = [];
    let available = false;
    server = createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        received.push({ headers: request.headers, body });
        response.writeHead(available ? 201 : 503);
        response.end();
      });
    });
    await new Promise<void>((resolve, reject) => {
      server?.once("error", reject);
      server?.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing HTTP test server address");
    vi.stubEnv(
      "FACTORY_WEBHOOK_URL",
      `http://127.0.0.1:${address.port}/webhooks/intake`,
    );
    vi.stubEnv("FACTORY_INTAKE_TOKEN", "test-intake-token");
    const response = await postFeedback(
      post("/api/feedback", {
        message: "Add keyboard shortcut Cmd+K for search",
      }),
    );
    expect(response.status).toBe(201);
    const accepted = await response.json();
    expect((await readDatabase()).feedback[0].delivery).toMatchObject({
      status: "pending",
      attempts: 1,
    });
    available = true;
    await updateDatabase((database) => {
      database.feedback[0].delivery.nextAttemptAt = new Date(0).toISOString();
    });
    await deliverPendingFeedback();
    expect(received).toHaveLength(2);
    expect(received[0].headers["idempotency-key"]).toBe(accepted.id);
    expect(received[1].headers.authorization).toBe("Bearer test-intake-token");
    expect(JSON.parse(received[1].body)).toMatchObject({
      eventId: accepted.id,
      source: "memoflow",
      type: "feedback",
      feedbackId: accepted.id,
    });
    expect((await readDatabase()).feedback[0].delivery).toMatchObject({
      status: "delivered",
      attempts: 2,
    });
    await deliverPendingFeedback();
    expect(received).toHaveLength(2);
  });

  it("reports the supplied runtime commit identity", async () => {
    vi.stubEnv("GIT_COMMIT_SHA", "abcdef1234");
    expect(await getBuildId().json()).toEqual({ commitSha: "abcdef1234" });
  });
});
