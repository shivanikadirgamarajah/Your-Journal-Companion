export type JournalEntry = {
  id: string;
  createdAt: string;
  text: string;
  wordCount: number;
};

const KEY = "journal_ai_entries";

export function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  const entries = raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  // newest first
  return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveEntry(text: string): JournalEntry {
  if (typeof window === "undefined") {
    throw new Error("saveEntry must be called in the browser");
  }

  const trimmed = text.trim();
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    text: trimmed,
    wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
  };

  const entries = getEntries();
  entries.push(entry);

  localStorage.setItem(KEY, JSON.stringify(entries));
  return entry;
}

export function getEntryById(id: string): JournalEntry | null {
  const entries = getEntries();
  return entries.find((e) => e.id === id) ?? null;
}

export function deleteEntry(id: string) {
  if (typeof window === "undefined") return;
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(entries));
}
