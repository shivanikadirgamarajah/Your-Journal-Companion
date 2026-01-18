export type ExtractedSignals = {
  moodScore: number; // 1-10
  stressScore: number; // 1-10
  emotions: string[];
  themes: string[];
  notes: string[];
};

export type RiskAssessment = {
  riskLevel: "low" | "medium" | "high";
  reason: string;
  showCrisisResources: boolean;
};

export type Recommendation = {
  id: string;
  title: string;
  why: string;
};

export type AgentLogStep = {
  agent: string;
  inputSummary: string;
  output: any;
};

export type AnalysisResult = {
  signals: ExtractedSignals;
  risk: RiskAssessment;
  recommendations: Recommendation[];
  tomorrowPrompt: string;
  log: AgentLogStep[];
};

// --- Agent 1: Extractor ---
function extractorAgent(entryText: string): { signals: ExtractedSignals; log: AgentLogStep } {
  const lower = entryText.toLowerCase();

  // super simple heuristics for now (we'll replace with real AI in Step 5)
  const stressWords = ["stressed", "overwhelmed", "anxious", "panic", "pressure", "deadline"];
  const sadWords = ["sad", "down", "hopeless", "empty", "tired"];
  const happyWords = ["happy", "good", "great", "excited", "proud"];

  const stressHits = stressWords.filter((w) => lower.includes(w)).length;
  const sadHits = sadWords.filter((w) => lower.includes(w)).length;
  const happyHits = happyWords.filter((w) => lower.includes(w)).length;

  const stressScore = Math.min(10, 3 + stressHits * 2);
  const moodScore = Math.max(1, Math.min(10, 6 + happyHits * 2 - sadHits * 2));

  const emotions: string[] = [];
  if (stressHits > 0) emotions.push("stressed");
  if (sadHits > 0) emotions.push("sad");
  if (happyHits > 0) emotions.push("positive");
  if (emotions.length === 0) emotions.push("neutral");

  const themes: string[] = [];
  if (lower.includes("school") || lower.includes("exam") || lower.includes("assignment")) themes.push("school");
  if (lower.includes("work") || lower.includes("boss") || lower.includes("shift")) themes.push("work");
  if (lower.includes("friend") || lower.includes("family")) themes.push("relationships");
  if (themes.length === 0) themes.push("general");

  const signals: ExtractedSignals = {
    moodScore,
    stressScore,
    emotions,
    themes,
    notes: [
      "This is a placeholder extractor (Step 4).",
      "Step 5 will replace this with real LLM extraction.",
    ],
  };

  return {
    signals,
    log: {
      agent: "ExtractorAgent",
      inputSummary: `Entry length: ${entryText.length} chars`,
      output: signals,
    },
  };
}

// --- Agent 2: Risk/Safety ---
function riskAgent(signals: ExtractedSignals, entryText: string): { risk: RiskAssessment; log: AgentLogStep } {
  const lower = entryText.toLowerCase();

  // basic safety trigger words (keep it simple + non-diagnostic)
  const crisisWords = ["suicide", "kill myself", "self harm", "end it", "hurt myself"];
  const crisisHit = crisisWords.some((w) => lower.includes(w));

  let riskLevel: "low" | "medium" | "high" = "low";
  let reason = "No strong risk signals detected.";

  if (signals.stressScore >= 8 && signals.moodScore <= 3) {
    riskLevel = "medium";
    reason = "High stress + low mood pattern detected.";
  }

  if (crisisHit) {
    riskLevel = "high";
    reason = "Crisis-related language detected.";
  }

  const risk: RiskAssessment = {
    riskLevel,
    reason,
    showCrisisResources: crisisHit,
  };

  return {
    risk,
    log: {
      agent: "RiskAgent",
      inputSummary: `mood=${signals.moodScore}, stress=${signals.stressScore}`,
      output: risk,
    },
  };
}

// --- Agent 3: Coach/Planner ---
function coachAgent(
  signals: ExtractedSignals,
  risk: RiskAssessment
): { recommendations: Recommendation[]; tomorrowPrompt: string; log: AgentLogStep } {
  const recommendations: Recommendation[] = [];

  if (risk.riskLevel === "high") {
    recommendations.push({
      id: "reach_out",
      title: "Reach out to someone now",
      why: "If you're feeling unsafe, contacting a trusted person or local services is the safest next step.",
    });
  } else {
    if (signals.stressScore >= 7) {
      recommendations.push({
        id: "breathing_2min",
        title: "2-minute breathing reset",
        why: "Quick way to reduce stress and calm your body.",
      });
      recommendations.push({
        id: "walk_10min",
        title: "10-minute walk",
        why: "Helps reset your attention and lowers stress.",
      });
    }

    if (signals.moodScore <= 4) {
      recommendations.push({
        id: "small_win",
        title: "Do one small win (5 minutes)",
        why: "A tiny task can increase momentum without pressure.",
      });
    }

    recommendations.push({
      id: "plan_3tasks",
      title: "Write a 3-task plan for tomorrow",
      why: "Turns overwhelm into clear next steps.",
    });
  }

  const tomorrowPrompt =
    risk.riskLevel === "high"
      ? "What support can you reach for right now?"
      : "What’s one thing you can simplify tomorrow to reduce stress?";

  return {
    recommendations,
    tomorrowPrompt,
    log: {
      agent: "CoachAgent",
      inputSummary: `risk=${risk.riskLevel}, stress=${signals.stressScore}, mood=${signals.moodScore}`,
      output: { recommendations, tomorrowPrompt },
    },
  };
}

// --- Orchestrator (the important part) ---
export function runMultiAgentAnalysis(entryText: string): AnalysisResult {
  const log: AgentLogStep[] = [];

  const step1 = extractorAgent(entryText);
  log.push(step1.log);

  const step2 = riskAgent(step1.signals, entryText);
  log.push(step2.log);

  const step3 = coachAgent(step1.signals, step2.risk);
  log.push(step3.log);

  return {
    signals: step1.signals,
    risk: step2.risk,
    recommendations: step3.recommendations,
    tomorrowPrompt: step3.tomorrowPrompt,
    log,
  };
}
