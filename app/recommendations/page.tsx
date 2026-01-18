"use client";

import { useEffect, useMemo, useState } from "react";
import { loadLatestAnalysis } from "@/lib/analysisStore";
import { trackEvent } from "@/lib/events";
import {
  Recommendation,
  getCompletedIds,
  getStartedIds,
  initActiveRecsFromAnalysis,
  markCompleted,
  markStarted,
  removeRecAndReplace,
  setActiveRecs,
} from "@/lib/recsStore";

type AnalysisResult = {
  recommendations: Recommendation[];
  tomorrowPrompt: string;
};

export default function RecommendationsPage() {
  const [active, setActive] = useState<Recommendation[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [startedIds, setStartedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const startedSet = useMemo(() => new Set(startedIds), [startedIds]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  function refreshFlags() {
    setStartedIds(getStartedIds());
    setCompletedIds(getCompletedIds());
  }

  useEffect(() => {
    const latest = loadLatestAnalysis() as AnalysisResult | null;

    if (!latest?.recommendations?.length) {
      setActive([]);
      setPrompt("");
      refreshFlags();
      return;
    }

    // Use analysis recs only if we don't already have active recs saved
    const init = initActiveRecsFromAnalysis(latest.recommendations);
    setActive(init);
    setPrompt(latest.tomorrowPrompt || "");

    trackEvent("recommendation_viewed", "demo-user", {
      count: init.length,
    });

    refreshFlags();
  }, []);

  function handleStart(rec: Recommendation) {
    if (completedSet.has(rec.id)) return;

    markStarted(rec.id);
    refreshFlags();

    trackEvent("recommendation_started", "demo-user", {
      rec_id: rec.id,
      title: rec.title,
    });
  }

  function handleComplete(rec: Recommendation) {
    if (completedSet.has(rec.id)) return;

    // 1) mark completed (persist)
    markCompleted(rec.id);

    // 2) remove from active and add a replacement (persist)
    const next = removeRecAndReplace(rec.id);
    setActive(next);

    // 3) refresh flags + track event
    refreshFlags();

    trackEvent("recommendation_completed", "demo-user", {
      rec_id: rec.id,
      title: rec.title,
      duration_min: 10,
    });

    // optional: immediately track that the list changed
    trackEvent("recommendations_refreshed", "demo-user", {
      active_count: next.length,
      replaced_from: rec.id,
      replacement_id: next[next.length - 1]?.id,
    });
  }

  function resetActiveToLatestAnalysis() {
    const latest = loadLatestAnalysis() as AnalysisResult | null;
    if (!latest?.recommendations?.length) return;

    // overwrite active recs with a fresh filtered set from analysis
    setActiveRecs([]); // clear saved active
    const init = initActiveRecsFromAnalysis(latest.recommendations);
    setActive(init);
    setPrompt(latest.tomorrowPrompt || "");
    refreshFlags();
  }

  return (
    <main>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Recommendations</h1>

      {active.length === 0 ? (
        <p style={{ marginTop: 12 }}>
          No recommendations yet. Go to Journal and click “Analyze entry”.
        </p>
      ) : (
        <>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button onClick={resetActiveToLatestAnalysis} style={{ padding: "8px 12px" }}>
              Based on your latest entry, we have found these activities for you:
            </button>
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {active.map((r) => {
              const isStarted = startedSet.has(r.id);
              const isCompleted = completedSet.has(r.id);

              return (
                <div
  key={r.id}
  style={{
    borderRadius: 10,
    padding: 16,
    opacity: isCompleted ? 0.5 : 1,

    // 👇 THIS is the new part
    border: isStarted
      ? "2px solid #facc15"   // green when started
      : "1px solid #22c55e",     // normal otherwise,

    boxShadow: isStarted
      ? "0 0 0 3px rgba(34, 197, 94, 0.15)" // soft green glow
      : "none",
  }}
>

                  <h2 style={{ fontSize: 18, fontWeight: 800 }}>{r.title}</h2>
                  <p style={{ marginTop: 6 }}>{r.why}</p>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => handleStart(r)}
                      disabled={isCompleted}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #333",
                      }}
                    >
                      {isStarted ? "In progress" : "Start"}
                    </button>

                    <button
                      onClick={() => handleComplete(r)}
                      disabled={isCompleted}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #333",
                      }}
                    >
                      Complete
                    </button>

                    {isStarted && !isCompleted && (
                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                        Started
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <section
            style={{
              marginTop: 20,
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Tomorrow’s prompt</h2>
            <p style={{ marginTop: 8 }}>{prompt}</p>
          </section>
        </>
      )}
    </main>
  );
}
