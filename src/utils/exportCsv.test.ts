import { afterEach, describe, expect, it, vi } from "vitest";
import seed from "../../data/seed.json";
import type { ActionItem } from "../lib/types";
import { CSV_HEADER, formatActionItemsCsv } from "./exportCsv";

afterEach(() => vi.unstubAllEnvs());

describe("selected workspace CSV", () => {
  it("escapes commas, quotes and embedded newlines with CRLF record boundaries", () => {
    expect(
      formatActionItemsCsv(
        seed.actionItems as ActionItem[],
        ["item-1", "item-2"],
        "team-alpha",
      ),
    ).toBe(
      `${CSV_HEADER}\r\nitem-1,"Fix login, session, and ""auth"" timeout",Alex Morgan,In progress,team-alpha\r\nitem-2,"Update Q4 roadmap,\nmetrics, and goals",Sam Rivera,To do,team-alpha\r\n`,
    );
  });
  it("exports only selected rows in the authorized workspace, without duplicating IDs", () => {
    const csv = formatActionItemsCsv(
      seed.actionItems as ActionItem[],
      ["item-1", "item-1", "item-3"],
      "team-alpha",
    );
    expect(csv).toContain("item-1,");
    expect(csv).not.toContain("item-2,");
    expect(csv).not.toContain("restricted-org");
    expect(csv.match(/item-1,/g)).toHaveLength(1);
  });
  it("exposes the deliberate empty-export fault only when explicitly enabled", () => {
    vi.stubEnv("SIMULATE_EMPTY_CSV_FAULT", "true");
    expect(
      formatActionItemsCsv(
        seed.actionItems as ActionItem[],
        ["item-1"],
        "team-alpha",
      ),
    ).toBe(`${CSV_HEADER}\r\n`);
  });
});
