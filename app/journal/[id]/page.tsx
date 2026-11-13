"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";                     // <-- NEW
import { getEntryById, deleteEntry, type JournalEntry } from "@/lib/JournalStore";
import { trackEvent } from "@/lib/events";

export default function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;               // <-- NOTE: Promise type
}) {
  const { id } = use(params);                    // <-- UNWRAP HERE

  const [entry] = useState<JournalEntry | null>(() => getEntryById(id));

  useEffect(() => {
    trackEvent("journal_entry_viewed", "demo-user", { entry_id: id });
  }, [id]);

  if (!entry) {
    return (
      <main>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Entry not found</h1>
        <p style={{ marginTop: 10 }}>
          <Link href="/journal" style={{ textDecoration: "underline" }}>
            Back to Journal →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Journal Entry</h1>
        <Link href="/journal" style={{ textDecoration: "underline" }}>
          Back →
        </Link>
      </div>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        {new Date(entry.createdAt).toLocaleString()} • {entry.wordCount} words
      </p>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
        }}
      >
        {entry.text}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            deleteEntry(entry.id);
            trackEvent("journal_entry_deleted", "demo-user", { entry_id: entry.id });
            window.location.href = "/journal";
          }}
          style={{ padding: "8px 12px", border: "1px solid #333", borderRadius: 10 }}
        >
          Delete entry
        </button>
      </div>
    </main>
  );
}
