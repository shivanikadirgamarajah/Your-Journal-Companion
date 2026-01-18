import type { Event } from "@/lib/events";

export type EventFeatures = {
  completedRecIds: string[];
  completionCount: number;
  mostCompletedRecId: string | null;
  avoidanceHint: string | null;
};

export function computeEventFeatures(events: Event[]): EventFeatures {
  const completed = events.filter((e) => e.name === "recommendation_completed");
  const completionCount = completed.length;

  const counts: Record<string, number> = {};
  for (const e of completed) {
    const recId = e.props?.rec_id;
    if (typeof recId === "string") {
      counts[recId] = (counts[recId] || 0) + 1;
    }
  }

  let mostCompletedRecId: string | null = null;
  let best = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > best) {
      best = v;
      mostCompletedRecId = k;
    }
  }

  const started = events.filter((e) => e.name === "recommendation_started").length;
  const completedN = completed.length;

  let avoidanceHint: string | null = null;
  if (started >= 3 && completedN === 0) {
    avoidanceHint = "User starts recommendations but often doesn't complete them—suggest smaller, easier actions.";
  }

  return {
    completedRecIds: completed.map((e) => e.props?.rec_id).filter(Boolean),
    completionCount,
    mostCompletedRecId,
    avoidanceHint,
  };
}
