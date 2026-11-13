import { NextResponse } from "next/server";
import {
  AIResponseValidationError,
  parseExtractedSignals,
  parseRiskAssessment,
  parseCoachResponse,
} from "@/lib/aiResponseValidation";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function callLLM(systemPrompt: string, userInput: unknown): Promise<unknown> {
  if (!OPENROUTER_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY in .env.local");
  }

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Journal AI Hackathon Project",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userInput) },
      ],
      temperature: 0.2,
    }),
  });

  const rawText = await resp.text();

  if (!resp.ok) {
    throw new Error(`OpenRouter HTTP ${resp.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const rawContent = data.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent.trim() : "";

  if (!content) throw new Error("No model content returned.");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Model did not return valid JSON. Got:\n" + content);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JsonObject;

    const entryText = typeof body.entryText === "string" ? body.entryText : "";
    const recentEvents = Array.isArray(body.recentEvents) ? body.recentEvents : [];
    const eventFeatures = isJsonObject(body.eventFeatures) ? body.eventFeatures : {};

    if (!entryText.trim()) {
      return NextResponse.json({ error: "Missing entryText" }, { status: 400 });
    }

    const log: Array<{ agent: string; inputSummary: string; output: unknown }> = [];

    // ─────────────────────────────
    // AGENT 1: EXTRACTOR
    // ─────────────────────────────
    const signals = parseExtractedSignals(
      await callLLM(
        `Return ONLY valid JSON (no markdown, no extra text).

Schema:
{
  "moodScore": number (1-10),
  "stressScore": number (1-10),
  "emotions": string[],
  "themes": string[],
  "notes": string[]
}

Rules:
- Be supportive and non-clinical
- Do NOT diagnose or give medical claims
- Use entryText + recentEvents + eventFeatures to infer patterns`,
      {
        entryText,
        recentEvents,
        eventFeatures,
      }
      )
    );

    log.push({
      agent: "ExtractorAgent",
      inputSummary: `chars=${entryText.length}, events=${recentEvents.length}`,
      output: signals,
    });

    // ─────────────────────────────
    // AGENT 2: RISK / SAFETY
    // ─────────────────────────────
    const risk = parseRiskAssessment(
      await callLLM(
        `Return ONLY valid JSON.

Schema:
{
  "riskLevel": "low" | "medium" | "high",
  "reason": string,
  "showCrisisResources": boolean
}

Rules:
- Use "high" ONLY if there is explicit self-harm intent
- Otherwise choose low/medium based on severity
- NO diagnosis
- Be careful, non-alarming, supportive`,
      {
        entryText,
        signals,
        eventFeatures,
      }
      )
    );

    log.push({
      agent: "RiskAgent",
      inputSummary: `mood=${signals.moodScore},stress=${signals.stressScore}`,
      output: risk,
    });

    // ─────────────────────────────
    // AGENT 3: COACH / PLANNER
    // ─────────────────────────────
    const coach = parseCoachResponse(
      await callLLM(
        `Return ONLY valid JSON.

Schema:
{
  "recommendations": [
    { "id": string, "title": string, "why": string }
  ],
  "tomorrowPrompt": string
}

Rules:
- Generate 3–5 small, realistic activities
- MUST personalize using:
    • signals
    • recentEvents
    • eventFeatures
- If eventFeatures.avoidanceHint exists:
    → suggest easier/smaller actions
- If eventFeatures.mostCompletedRecId exists:
    → include at least one similar activity
- Avoid medical claims
- No diagnosis`,
      {
        signals,
        risk,
        recentEvents,
        eventFeatures,
      }
      )
    );

    log.push({
      agent: "CoachAgent",
      inputSummary: `risk=${risk.riskLevel}`,
      output: coach,
    });

    // ─────────────────────────────
    // FINAL RESPONSE
    // ─────────────────────────────
    return NextResponse.json({
      signals,
      risk,
      recommendations: coach.recommendations,
      tomorrowPrompt: coach.tomorrowPrompt,
      log,
    });
  } catch (error: unknown) {
    if (error instanceof AIResponseValidationError) {
      console.error("AI response validation failed:", error.message);

      return Response.json(
        { error: "Invalid AI service response" },
        { status: 502 }
      );
    }

    console.error("API /analyze error:", error);

    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
