import type { Activity, ActivityType } from "@/types";

const SEED: [workerId: string, message: string, minutesAgo: number, type: ActivityType][] = [
  ["w-analysing", "Reel #19 crossed 9.8K views — trending above average", 1, "success"],
  ["w-publishing", "Reel #20 scheduled for 7:00 PM peak slot", 3, "info"],
  ["w-editing", "Kiran synced cuts to the beat drop on Reel #21", 5, "info"],
  ["w-copywriting", "Meera started the caption for Reel #22", 8, "info"],
  ["w-strategy", "Arjun updated the hook for Reel #23 to 2.5 sec", 11, "info"],
  ["w-research", "Riya found a new trending audio: “Future Bass”", 14, "success"],
  ["w-analysing", "Reel #18 saves up 22% in the last hour", 19, "success"],
  ["w-editing", "Render took longer than usual on Reel #21", 23, "warning"],
  ["w-publishing", "Reel #19 published to Instagram", 31, "success"],
  ["w-copywriting", "Hashtag set refreshed for Reel #27", 38, "info"],
  ["w-research", "“POV hooks” are up 41% this week", 46, "info"],
  ["w-strategy", "Angle locked for Reel #22: relatable morning struggle", 55, "success"],
  ["w-analysing", "Weekly report ready: avg engagement 8.4%", 68, "success"],
  ["w-editing", "Reel #20 export finished in 4K", 82, "success"],
  ["w-research", "Competitor scan complete: 12 new reel ideas", 97, "info"],
];

export function createDefaultActivity(now: number = Date.now()): Activity[] {
  return SEED.map(([workerId, message, minutesAgo, type], i) => ({
    id: `act-seed-${i}`,
    workerId,
    message,
    type,
    at: new Date(now - minutesAgo * 60_000).toISOString(),
  }));
}

export const RANDOM_EVENTS: { role: string; messages: string[] }[] = [
  {
    role: "research",
    messages: [
      "found a new trending audio",
      "spotted a rising hook format: “Wait for it…”",
      "flagged “Before/After” edits trending in your niche",
      "pulled 8 fresh competitor reels for reference",
    ],
  },
  {
    role: "strategy",
    messages: [
      "updated the hook for Reel #{n}",
      "moved the CTA to the final 2 seconds of Reel #{n}",
      "suggested posting Reel #{n} on Thursday",
    ],
  },
  {
    role: "copywriting",
    messages: [
      "tightened the caption on Reel #{n}",
      "A/B tested two hooks for Reel #{n}",
      "added a save-worthy CTA to Reel #{n}",
    ],
  },
  {
    role: "editing",
    messages: [
      "synced cuts to the beat on Reel #{n}",
      "colour graded Reel #{n} with a warm LUT",
      "trimmed 1.2s of dead air from Reel #{n}",
    ],
  },
  {
    role: "publishing",
    messages: [
      "moved Reel #{n} to the 7:00 PM peak slot",
      "added location and alt-text to Reel #{n}",
      "cross-posted Reel #{n} to Stories",
    ],
  },
  {
    role: "analysing",
    messages: [
      "noticed saves spiking on Reel #{n}",
      "Reel #{n} is beating the 7-day average",
      "updated the weekly engagement report",
    ],
  },
];
