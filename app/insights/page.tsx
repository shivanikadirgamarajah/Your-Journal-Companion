"use client";

import Link from "next/link";
import { useState } from "react";
import { loadLatestAnalysis, loadAnalysisHistory } from "@/lib/analysisStore";
import type { AnalysisResult } from "@/lib/agents/orchestrator";
import type { AnalysisHistoryEntry } from "@/lib/analysisStore";
import SafetyBanner from "@/components/SafetyBanner";

export default function InsightsPage() {
  const [data] = useState<AnalysisResult | null>(() => loadLatestAnalysis());
  const [history] = useState<AnalysisHistoryEntry[]>(() => loadAnalysisHistory());

  function exportSummary() {
    if (!data) return;

    const text = `Journal AI Summary
Date: ${new Date().toLocaleString()}

Signals:
- Mood: ${data.signals.moodScore}/10
- Stress: ${data.signals.stressScore}/10
- Emotions: ${data.signals.emotions.join(", ")}
- Themes: ${data.signals.themes.join(", ")}

Risk:
- Level: ${data.risk.riskLevel}
- Reason: ${data.risk.reason}

Tomorrow prompt:
${data.tomorrowPrompt}
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "journal-summary.txt";
    a.click();

    URL.revokeObjectURL(url);
  }

  if (!data) {
    return (
      <main>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Insights</h1>
        <SafetyBanner />
        <p style={{ marginTop: 8 }}>
          No analysis yet. Go to Journal and click “Analyze entry”.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Insights</h1>
      <SafetyBanner />

      <button onClick={exportSummary} style={{ marginTop: 12, padding: "8px 12px" }}>
        Export summary
      </button>

      <div style={{ marginTop: 12 }}>
        <Link href="/recommendations" style={{ textDecoration: "underline" }}>
          Go to Recommendations →
        </Link>
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Signals</h2>
        <ul style={{ marginTop: 8 }}>
          <li>Mood score: {data.signals.moodScore}/10</li>
          <li>Stress score: {data.signals.stressScore}/10</li>
          <li>Emotions: {data.signals.emotions.join(", ")}</li>
          <li>Themes: {data.signals.themes.join(", ")}</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>
          Weekly trend (last 7 analyses)
        </h2>

        {history.length === 0 ? (
          <p style={{ marginTop: 8 }}>No history yet — analyze a few entries.</p>
        ) : (
          (() => {
            const last7 = history.slice(-7);
            const avgMood =
              last7.reduce(
                (sum, h) => sum + (h.signals?.moodScore || 0),
                0
              ) / last7.length;
            const avgStress =
              last7.reduce(
                (sum, h) => sum + (h.signals?.stressScore || 0),
                0
              ) / last7.length;

            return (
              <ul style={{ marginTop: 8 }}>
                <li>Average mood: {avgMood.toFixed(1)}/10</li>
                <li>Average stress: {avgStress.toFixed(1)}/10</li>
                <li>Entries tracked: {last7.length}</li>
              </ul>
            );
          })()
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Risk / Safety</h2>
        <p style={{ marginTop: 8 }}>
          <b>Risk level:</b> {data.risk.riskLevel}
        </p>
        <p style={{ marginTop: 6 }}>{data.risk.reason}</p>

        {data.risk.showCrisisResources && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: "1px solid #f2c",
              borderRadius: 8,
            }}
          >
            <b>If you feel unsafe right now:</b> contact local emergency services
            or a trusted person.
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Tomorrow prompt</h2>
        <p style={{ marginTop: 8 }}>{data.tomorrowPrompt}</p>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>
          View multi-agent log
        </summary>
        <pre
          style={{
            marginTop: 10,
            padding: 12,
            background: "#f7f7f7",
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(data.log, null, 2)}
        </pre>
      </details>
    </main>
  );
}
