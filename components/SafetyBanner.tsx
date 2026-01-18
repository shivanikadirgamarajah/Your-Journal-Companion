"use client";

import { useState } from "react";

export default function SafetyBanner() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        marginTop: 12,
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <b>Safety:</b> This tool supports reflection and habits — it does not diagnose or replace professional care.
        </div>
        <button onClick={() => setOpen((v) => !v)} style={{ padding: "6px 10px" }}>
          {open ? "Hide" : "Get help"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10, lineHeight: 1.4 }}>
          <p style={{ marginTop: 0 }}>
            If you feel unsafe right now or are thinking about self-harm, contact local emergency services or a trusted person.
          </p>
          <ul style={{ marginTop: 8 }}>
            <li>
              <b>Canada:</b> Call or text <b>988</b> (Suicide Crisis Helpline).
            </li>
            <li>
              <b>US:</b> Call or text <b>988</b> (Suicide &amp; Crisis Lifeline).
            </li>
            <li>
              If you’re outside Canada/US, search for your local crisis hotline or emergency number.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
