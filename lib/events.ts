export type EventProps = Record<string, unknown>;

export type Event = {
  name: string;
  userId: string;
  props: EventProps;
  timestamp: string;
};

const STORAGE_KEY = "journal_ai_events";

export function getEvents(): Event[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Event[]) : [];
}

export function trackEvent(
  name: string,
  userId: string,
  props: EventProps = {}
) {
  if (typeof window === "undefined") return;

  const event: Event = {
    name,
    userId,
    props,
    timestamp: new Date().toISOString(),
  };

  const events = getEvents();
  events.push(event);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

  console.log("EVENT TRACKED:", event);
}

export function clearEvents() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
