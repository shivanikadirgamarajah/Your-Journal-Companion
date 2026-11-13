"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SafetyBanner from "@/components/SafetyBanner";
import Card from "@/components/Card";
import Button from "@/components/Button";

import { saveLatestAnalysis } from "@/lib/analysisStore";
import { getEvents, trackEvent } from "@/lib/events";
import { computeEventFeatures } from "@/lib/eventFeatures";
import { getEntries, saveEntry, type JournalEntry } from "@/lib/JournalStore";

export default function JournalPage() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) {
      alert("Write something first.");
      return;
    }

    const entry = saveEntry(trimmed);

    trackEvent("journal_entry_created", "demo-user", {
      entry_id: entry.id,
      word_count: entry.wordCount,
      time_of_day: new Date().getHours(),
    });

    setText("");
    setEntries(getEntries());

    alert("Saved! You can view it in Past entries.");
  }

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) {
      alert("Write something first.");
      return;
    }

    try {
      setIsAnalyzing(true);

      // Save the entry first so analysis can be tied to an entry_id
      const entry = saveEntry(trimmed);
      setEntries(getEntries());

      trackEvent("journal_entry_analyzed", "demo-user", {
        entry_id: entry.id,
        preview: trimmed.slice(0, 50),
        chars: trimmed.length,
      });

      const recentEvents = getEvents().slice(-100);
      const eventFeatures = computeEventFeatures(recentEvents);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryText: trimmed,
          recentEvents,
          eventFeatures,
          entryId: entry.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Analyze failed: " + (err.error || res.statusText));
        return;
      }

      const result = await res.json();
      saveLatestAnalysis(result);

      trackEvent("analysis_completed", "demo-user", {
        entry_id: entry.id,
        mood: result.signals?.moodScore,
        stress: result.signals?.stressScore,
        risk: result.risk?.riskLevel,
        rec_count: result.recommendations?.length || 0,
      });

      alert("Analysis complete! Go to Insights.");
      setText("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      alert("Analyze failed: " + message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Write about your day. We’ll turn it into insights + small next steps.
        </p>
      </div>

      <SafetyBanner />

      <Card title="Today’s entry">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What happened today? What did you feel? What mattered?"
          className="min-h-[220px] w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 text-sm outline-none focus:border-zinc-400"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleSave} variant="secondary">
            Save entry
          </Button>

          <Button onClick={handleAnalyze} variant="primary">
            {isAnalyzing ? "Analyzing..." : "Analyze entry"}
          </Button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Prototype note: entries, events, and insights are stored locally in your browser.
        </p>
      </Card>

      <Card title="Past entries">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-600">No entries saved yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {entries.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/journal/${e.id}`}
                    className="text-sm font-semibold text-zinc-900 hover:underline"
                  >
                    {new Date(e.createdAt).toLocaleString()}
                  </Link>
                  <span className="text-xs text-zinc-500">{e.wordCount} words</span>
                </div>

                <p className="mt-1 text-sm text-zinc-600">
                  {e.text.slice(0, 120)}
                  {e.text.length > 120 ? "..." : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
