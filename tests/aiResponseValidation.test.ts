import { describe, expect, it } from "vitest";
import {
  AIResponseValidationError,
  parseCoachResponse,
  parseExtractedSignals,
  parseRiskAssessment,
} from "../lib/aiResponseValidation";

const validSignals = {
  moodScore: 6,
  stressScore: 3,
  emotions: ["hopeful"],
  themes: ["school"],
  notes: ["Had a good day"],
};
const validRisk = {
  riskLevel: "low",
  reason: "No explicit risk detected",
  showCrisisResources: false,
};
const validCoach = {
  recommendations: [{ id: "walk", title: "Take a walk", why: "A small break" }],
  tomorrowPrompt: "What went well today?",
};

describe("ExtractorAgent schema", () => {
  it("accepts a valid response", () => {
    expect(parseExtractedSignals(validSignals)).toEqual(validSignals);
  });
  it.each([0, -1, 11, NaN, Infinity, "5", null])("rejects an invalid mood score (%s)", (moodScore) => {
    expect(() => parseExtractedSignals({ ...validSignals, moodScore })).toThrow(AIResponseValidationError);
  });
  it("rejects missing fields and non-string lists", () => {
    expect(() => parseExtractedSignals({ moodScore: 6 })).toThrow(AIResponseValidationError);
    expect(() => parseExtractedSignals({ ...validSignals, emotions: ["happy", 5] })).toThrow(AIResponseValidationError);
  });
});

describe("RiskAgent schema", () => {
  it("accepts a valid response", () => {
    expect(parseRiskAssessment(validRisk)).toEqual(validRisk);
  });
  it("rejects invalid risk levels and nonboolean flags", () => {
    expect(() => parseRiskAssessment({ ...validRisk, riskLevel: "critical" })).toThrow(AIResponseValidationError);
    expect(() => parseRiskAssessment({ ...validRisk, showCrisisResources: "false" })).toThrow(AIResponseValidationError);
  });
  it("requires crisis resources for high-risk responses", () => {
    expect(() => parseRiskAssessment({ ...validRisk, riskLevel: "high" })).toThrow(AIResponseValidationError);
    expect(parseRiskAssessment({ ...validRisk, riskLevel: "high", showCrisisResources: true }).riskLevel).toBe("high");
  });
});

describe("CoachAgent schema", () => {
  it("accepts a valid response", () => {
    expect(parseCoachResponse(validCoach)).toEqual(validCoach);
  });
  it("rejects empty recommendation lists and empty prompts", () => {
    expect(() => parseCoachResponse({ ...validCoach, recommendations: [] })).toThrow(AIResponseValidationError);
    expect(() => parseCoachResponse({ ...validCoach, tomorrowPrompt: " " })).toThrow(AIResponseValidationError);
  });
  it("rejects missing recommendation fields and repeated IDs", () => {
    expect(() => parseCoachResponse({ ...validCoach, recommendations: [{ id: "a" }] })).toThrow(AIResponseValidationError);
    expect(() => parseCoachResponse({ ...validCoach, recommendations: [validCoach.recommendations[0], validCoach.recommendations[0]] })).toThrow(AIResponseValidationError);
  });
  it("rejects nonobjects", () => {
    expect(() => parseCoachResponse("not-json-data")).toThrow(AIResponseValidationError);
    expect(() => parseRiskAssessment(null)).toThrow(AIResponseValidationError);
    expect(() => parseExtractedSignals([])).toThrow(AIResponseValidationError);
  });
});
