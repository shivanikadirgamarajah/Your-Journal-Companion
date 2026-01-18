import type { AnalysisResult } from "@/lib/agents/orchestrator";

const LATEST_KEY = "journal_ai_latest_analysis";
const HISTORY_KEY = "journal_ai_analysis_history";

export function saveLatestAnalysis(result: AnalysisResult) {
  if (typeof window === "undefined") return;

  localStorage.setItem(LATEST_KEY, JSON.stringify(result));

  const historyRaw = localStorage.getItem(HISTORY_KEY);
  const history = historyRaw ? (JSON.parse(historyRaw) as any[]) : [];

  history.push({
    timestamp: new Date().toISOString(),
    signals: result.signals,
    risk: result.risk,
  });

  // keep last 30 entries
  const trimmed = history.slice(-30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function loadLatestAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LATEST_KEY);
  return raw ? (JSON.parse(raw) as AnalysisResult) : null;
}

export function loadAnalysisHistory(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as any[]) : [];
}
