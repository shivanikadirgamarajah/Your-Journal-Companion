import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getActiveRecs,
  getCompletedIds,
  getStartedIds,
  initActiveRecsFromAnalysis,
  markCompleted,
  markStarted,
  pickReplacement,
  removeRecAndReplace,
  setActiveRecs,
  type Recommendation,
} from "../lib/recsStore";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

const recs: Recommendation[] = [
  { id: "custom-a", title: "Take a break", why: "Rest" },
  { id: "custom-b", title: "Write a plan", why: "Clarity" },
];

beforeEach(() => {
  // These helpers only need localStorage and the existence of window.
  const storage = new MemoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => vi.unstubAllGlobals());

describe("recommendation persistence", () => {
  it("persists started IDs without duplicating them", () => {
    markStarted("custom-a");
    markStarted("custom-a");
    expect(getStartedIds()).toEqual(["custom-a"]);
    expect(JSON.parse(localStorage.getItem("journal_ai_started_rec_ids")!)).toEqual(["custom-a"]);
  });

  it("persists completion and removes the recommendation from started IDs", () => {
    markStarted("custom-a");
    markCompleted("custom-a");
    markCompleted("custom-a");
    expect(getStartedIds()).toEqual([]);
    expect(getCompletedIds()).toEqual(["custom-a"]);
  });

  it("initializes active recommendations and retains saved choices across subsequent reads", () => {
    expect(initActiveRecsFromAnalysis(recs)).toEqual(recs);
    expect(initActiveRecsFromAnalysis([{ id: "new", title: "New", why: "New" }])).toEqual(recs);
    expect(getActiveRecs()).toEqual(recs);
  });

  it("never restores completed recommendations from a new analysis", () => {
    markCompleted("custom-a");
    expect(initActiveRecsFromAnalysis(recs)).toEqual([recs[1]]);
    expect(getActiveRecs()).toEqual([recs[1]]);
  });

  it("removes a completed recommendation and persists an eligible replacement", () => {
    setActiveRecs(recs);
    markCompleted("custom-a");
    const next = removeRecAndReplace("custom-a");
    expect(next.some((rec) => rec.id === "custom-a")).toBe(false);
    expect(next.some((rec) => rec.id === "custom-b")).toBe(true);
    expect(next).toHaveLength(2);
    expect(getActiveRecs()).toEqual(next);
    expect(getCompletedIds()).toContain("custom-a");
  });

  it("does not reuse a completed or active fallback recommendation", () => {
    markCompleted("walk_10");
    const replacement = pickReplacement([
      { id: "breath_2", title: "Breathing", why: "Calm" },
    ]);
    expect(replacement?.id).toBe("stretch_5");
  });
});
