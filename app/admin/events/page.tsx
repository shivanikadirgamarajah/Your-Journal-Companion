"use client";

import { useState } from "react";
import { clearEvents, Event, getEvents } from "@/lib/events";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>(() => getEvents());

  function refresh() {
    setEvents(getEvents());
  }

  const total = events.length;
  const completed = events.filter((e) => e.name === "recommendation_completed").length;

  return (
    <main>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin • Events</h1>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button onClick={refresh} style={{ padding: "8px 12px" }}>
          Refresh
        </button>

        <button
          onClick={() => {
            clearEvents();
            refresh();
          }}
          style={{ padding: "8px 12px" }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>Total events</div>
          <div style={{ fontSize: 22 }}>{total}</div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>Completed activities</div>
          <div style={{ fontSize: 22 }}>{completed}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Time</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Event</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>User</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Props</th>
            </tr>
          </thead>

          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{e.timestamp}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{e.name}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{e.userId}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  <code>{JSON.stringify(e.props)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {events.length === 0 && (
          <p style={{ marginTop: 12 }}>No events yet. Go click buttons on Journal/Recommendations.</p>
        )}
      </div>
    </main>
  );
}
