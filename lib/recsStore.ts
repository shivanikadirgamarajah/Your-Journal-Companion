export type Recommendation = {
  id: string;
  title: string;
  why: string;
};

const ACTIVE_KEY = "journal_ai_active_recs";
const COMPLETED_KEY = "journal_ai_completed_rec_ids";
const STARTED_KEY = "journal_ai_started_rec_ids";

// A backup pool so you can always replace an activity immediately
const FALLBACK_POOL: Recommendation[] = [
  { id: "walk_10", title: "10-minute walk", why: "Low effort stress reset." },
  { id: "breath_2", title: "2-minute breathing", why: "Quick calm for your nervous system." },
  { id: "stretch_5", title: "5-minute stretch", why: "Release tension stored in your body." },
  { id: "water", title: "Drink water", why: "Small basics improve energy and focus." },
  { id: "tidy_5", title: "Tidy one small area (5 min)", why: "Reduces mental clutter fast." },
  { id: "music_1", title: "Listen to one calming song", why: "A quick mood shift." },
  { id: "journal_prompt", title: "Answer a 1-line prompt", why: "Build insight without effort." },
  { id: "sunlight_3", title: "Get 3 minutes of sunlight", why: "Helps regulate mood and wakefulness." },
  { id: "text_friend", title: "Send a friendly text", why: "Connection supports stability." },
  { id: "plan_3", title: "Write 3 tasks for tomorrow", why: "Turns overwhelm into clarity." },
];

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeJSON(key: string, value: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCompletedIds(): string[] {
  return readJSON<string[]>(COMPLETED_KEY, []);
}

export function getStartedIds(): string[] {
  return readJSON<string[]>(STARTED_KEY, []);
}

export function markStarted(id: string) {
  const started = new Set(getStartedIds());
  started.add(id);
  writeJSON(STARTED_KEY, Array.from(started));
}

export function markCompleted(id: string) {
  const completed = new Set(getCompletedIds());
  completed.add(id);
  writeJSON(COMPLETED_KEY, Array.from(completed));

  // also remove from started if it was started
  const started = new Set(getStartedIds());
  started.delete(id);
  writeJSON(STARTED_KEY, Array.from(started));
}

export function getActiveRecs(): Recommendation[] {
  return readJSON<Recommendation[]>(ACTIVE_KEY, []);
}

export function setActiveRecs(recs: Recommendation[]) {
  writeJSON(ACTIVE_KEY, recs);
}

/**
 * Pick a replacement rec that:
 * - is not completed
 * - is not currently active
 */
export function pickReplacement(active: Recommendation[]): Recommendation | null {
  const completed = new Set(getCompletedIds());
  const activeIds = new Set(active.map((r) => r.id));

  const candidate = FALLBACK_POOL.find(
    (r) => !completed.has(r.id) && !activeIds.has(r.id)
  );

  return candidate || null;
}

/**
 * Initialize active recs from analysis once, then keep them persistent.
 * - Filters out completed recs.
 */
export function initActiveRecsFromAnalysis(analysisRecs: Recommendation[]): Recommendation[] {
  const existing = getActiveRecs();
  if (existing.length > 0) return existing;

  const completed = new Set(getCompletedIds());
  const filtered = analysisRecs.filter((r) => !completed.has(r.id));

  setActiveRecs(filtered);
  return filtered;
}

export function removeRecAndReplace(id: string): Recommendation[] {
  const current = getActiveRecs();
  const next = current.filter((r) => r.id !== id);

  const replacement = pickReplacement(next);
  if (replacement) next.push(replacement);

  setActiveRecs(next);
  return next;
}
