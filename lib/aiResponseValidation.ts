import type {
  ExtractedSignals,
  Recommendation,
  RiskAssessment,
} from "./agents/orchestrator";

export type CoachResponse = {
  recommendations: Recommendation[];
  tomorrowPrompt: string;
};

export class AIResponseValidationError extends Error {
  constructor(agent: string, reason: string) {
    super(`Invalid ${agent} response: ${reason}`);
    this.name = "AIResponseValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 10
  );
}

export function parseExtractedSignals(value: unknown): ExtractedSignals {
  if (!isRecord(value)) {
    throw new AIResponseValidationError("ExtractorAgent", "expected an object");
  }

  const { moodScore, stressScore, emotions, themes, notes } = value;
  if (!isScore(moodScore) || !isScore(stressScore)) {
    throw new AIResponseValidationError("ExtractorAgent", "scores must be numbers from 1 to 10");
  }
  if (!isStringArray(emotions) || !isStringArray(themes) || !isStringArray(notes)) {
    throw new AIResponseValidationError("ExtractorAgent", "emotions, themes, and notes must be string arrays");
  }

  return { moodScore, stressScore, emotions, themes, notes };
}

export function parseRiskAssessment(value: unknown): RiskAssessment {
  if (!isRecord(value)) {
    throw new AIResponseValidationError("RiskAgent", "expected an object");
  }

  const { riskLevel, reason, showCrisisResources } = value;
  if (riskLevel !== "low" && riskLevel !== "medium" && riskLevel !== "high") {
    throw new AIResponseValidationError("RiskAgent", "unknown risk level");
  }
  if (!isNonEmptyString(reason) || typeof showCrisisResources !== "boolean") {
    throw new AIResponseValidationError("RiskAgent", "invalid reason or crisis-resources flag");
  }
  if (riskLevel === "high" && !showCrisisResources) {
    throw new AIResponseValidationError("RiskAgent", "high risk must enable crisis resources");
  }

  return { riskLevel, reason, showCrisisResources };
}

export function parseCoachResponse(value: unknown): CoachResponse {
  if (!isRecord(value)) {
    throw new AIResponseValidationError("CoachAgent", "expected an object");
  }
  if (!isNonEmptyString(value.tomorrowPrompt)) {
    throw new AIResponseValidationError("CoachAgent", "missing tomorrow prompt");
  }
  if (!Array.isArray(value.recommendations) || value.recommendations.length === 0) {
    throw new AIResponseValidationError("CoachAgent", "expected at least one recommendation");
  }

  const seen = new Set<string>();
  const recommendations: Recommendation[] = value.recommendations.map((rec, index) => {
    if (
      !isRecord(rec) ||
      !isNonEmptyString(rec.id) ||
      !isNonEmptyString(rec.title) ||
      !isNonEmptyString(rec.why)
    ) {
      throw new AIResponseValidationError("CoachAgent", `invalid recommendation at index ${index}`);
    }
    if (seen.has(rec.id)) {
      throw new AIResponseValidationError("CoachAgent", `duplicate recommendation id at index ${index}`);
    }
    seen.add(rec.id);
    return { id: rec.id, title: rec.title, why: rec.why };
  });

  return { recommendations, tomorrowPrompt: value.tomorrowPrompt };
}
