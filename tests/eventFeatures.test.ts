import { describe, expect, it } from "vitest";
import { computeEventFeatures } from "../lib/eventFeatures";
import type { Event } from "../lib/events";

function event(name: string, recId?: string): Event {
  return {
    name,
    userId: "test-user",
    props: recId === undefined ? {} : { rec_id: recId },
    timestamp: "2026-01-01T12:00:00.000Z",
  };
}

describe("computeEventFeatures", () => {
  it("returns empty defaults when no events exist", () => {
    expect(computeEventFeatures([])).toEqual({
      completedRecIds: [],
      completionCount: 0,
      mostCompletedRecId: null,
      avoidanceHint: null,
    });
  });

  it("counts completions and identifies the most frequently completed recommendation", () => {
    expect(computeEventFeatures([
      event("recommendation_completed", "walk"),
      event("recommendation_completed", "water"),
      event("recommendation_completed", "walk"),
      event("recommendation_started", "breathing"),
    ])).toEqual({
      completedRecIds: ["walk", "water", "walk"],
      completionCount: 3,
      mostCompletedRecId: "walk",
      avoidanceHint: null,
    });
  });

  it("signals avoidance after three starts and zero completions", () => {
    const result = computeEventFeatures([
      event("recommendation_started", "a"),
      event("recommendation_started", "b"),
      event("recommendation_started", "c"),
    ]);
    expect(result.avoidanceHint).toContain("smaller, easier actions");
    expect(result.completionCount).toBe(0);
  });

  it("does not signal avoidance with fewer starts or any completion", () => {
    expect(computeEventFeatures([
      event("recommendation_started", "a"),
      event("recommendation_started", "b"),
    ]).avoidanceHint).toBeNull();

    expect(computeEventFeatures([
      event("recommendation_started", "a"),
      event("recommendation_started", "b"),
      event("recommendation_started", "c"),
      event("recommendation_completed", "a"),
    ]).avoidanceHint).toBeNull();
  });

  it("ignores completions without a string recommendation id when selecting the most frequent id", () => {
    const result = computeEventFeatures([
      event("recommendation_completed"),
      event("recommendation_completed", "walk"),
      event("journal_entry_created"),
    ]);
    expect(result.completionCount).toBe(2);
    expect(result.completedRecIds).toEqual(["walk"]);
    expect(result.mostCompletedRecId).toBe("walk");
  });
});
