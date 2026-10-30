import type { Reel, ReelStats, WorkerRole } from "@/types";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=540&h=960&fit=crop&crop=entropy&auto=format&q=70`;

export const THUMBNAILS = {
  tech: img("1498050108023-c5249f4df085"),
  tech2: img("1517694712202-14dd9538aa97"),
  food: img("1504674900247-0877df9cc836"),
  food2: img("1512621776951-a57141f2eefd"),
  travel: img("1507525428034-b723cf961d3e"),
  travel2: img("1469854523086-cc02fe5d8800"),
  fitness: img("1517836357463-d25dfeac3438"),
  fitness2: img("1571019613454-1cb2f99b2d8b"),
  product: img("1523275335684-37898b6baf30"),
  product2: img("1505740420928-5e560c06d30e"),
  bts: img("1492691527719-9d1e07e534b4"),
  bts2: img("1516035069371-29a1b244cc32"),
  motivation: img("1506126613408-eca07ce68773"),
  motivation2: img("1500530855697-b586d89ba3ee"),
  comedy: img("1529156069898-49953e39b3ac"),
  comedy2: img("1511632765486-a01980e01a18"),
} as const;

export const THUMBNAIL_CHOICES = Object.values(THUMBNAILS);

type Seed = {
  n: number;
  title: string;
  thumbnail: string;
  hook: string;
  caption: string;
  hashtags: string[];
  audio: string;
};

const SEEDS: Seed[] = [
  {
    n: 16,
    title: "3 VS Code shortcuts nobody uses",
    thumbnail: THUMBNAILS.tech,
    hook: "Stop scrolling if you code every day",
    caption: "Shortcut #2 saved me an hour this week. Save this for your next coding session.",
    hashtags: ["#codingtips", "#vscode", "#developer", "#techreels"],
    audio: "Lo-fi Focus Beat · Chillhop",
  },
  {
    n: 17,
    title: "15-minute butter garlic pasta",
    thumbnail: THUMBNAILS.food,
    hook: "The pasta I make when I'm too tired to cook",
    caption: "5 ingredients, one pan, zero stress. Recipe in the comments 🍝",
    hashtags: ["#easyrecipes", "#pasta", "#foodreels", "#dinnerideas"],
    audio: "Kitchen Groove · Original audio",
  },
  {
    n: 18,
    title: "Hidden beaches of Gokarna",
    thumbnail: THUMBNAILS.travel,
    hook: "Nobody talks about this beach in India",
    caption: "No crowds, clear water, ₹0 entry. Pin this for your next trip 🌊",
    hashtags: ["#travelindia", "#gokarna", "#hiddengems", "#beachvibes"],
    audio: "Summer Drive · Kygo style",
  },
  {
    n: 19,
    title: "10-min home workout, no gear",
    thumbnail: THUMBNAILS.fitness,
    hook: "No gym? No excuse. 10 minutes. Go.",
    caption: "Do this 4x a week and thank me in a month 💪 Save it so you don't forget.",
    hashtags: ["#homeworkout", "#fitnessreels", "#noequipment", "#fitindia"],
    audio: "Power Up · Workout Mix",
  },
  {
    n: 20,
    title: "Launch day: Aurora smartwatch",
    thumbnail: THUMBNAILS.product,
    hook: "We spent 18 months on this one detail",
    caption: "Aurora is finally here. Link in bio for early-bird pricing ⌚",
    hashtags: ["#productlaunch", "#smartwatch", "#newdrop", "#design"],
    audio: "Cinematic Rise · Epic Trailer",
  },
  {
    n: 21,
    title: "Behind the scenes: our studio shoot",
    thumbnail: THUMBNAILS.bts,
    hook: "What a 30-second reel actually takes",
    caption: "6 hours, 214 takes, 1 very patient camera person 🎬",
    hashtags: ["#behindthescenes", "#contentcreator", "#studiolife", "#bts"],
    audio: "Making Of · Original audio",
  },
  {
    n: 22,
    title: "5 AM club — honest review",
    thumbnail: THUMBNAILS.motivation,
    hook: "I woke up at 5 AM for 30 days. Here's the truth",
    caption: "It's not about the hour, it's about the first hour. Save this for Monday.",
    hashtags: ["#motivation", "#morningroutine", "#discipline", "#selfgrowth"],
    audio: "Rise · Inspirational Piano",
  },
  {
    n: 23,
    title: "When mom finds your Amazon cart",
    thumbnail: THUMBNAILS.comedy,
    hook: "POV: mom checks your order history",
    caption: "Tag the friend whose cart is just snacks 😂",
    hashtags: ["#comedyreels", "#desimom", "#relatable", "#funny"],
    audio: "Oh No · Kreepa",
  },
  {
    n: 24,
    title: "AI tools that replace 5 apps",
    thumbnail: THUMBNAILS.tech2,
    hook: "Delete these 5 apps. Use this instead.",
    caption: "One tool, five jobs. Which one surprised you? 👇",
    hashtags: ["#aitools", "#productivity", "#techtips", "#workflow"],
    audio: "Future Bass · Trending audio",
  },
  {
    n: 25,
    title: "Street food crawl: Old Delhi",
    thumbnail: THUMBNAILS.food2,
    hook: "₹500 in Old Delhi gets you THIS much food",
    caption: "Ranked every stall from 1 to 10. Number 1 changed my life 🥟",
    hashtags: ["#streetfood", "#delhifood", "#foodie", "#indianfood"],
    audio: "Bazaar Beats · Original audio",
  },
  {
    n: 26,
    title: "Van life week one",
    thumbnail: THUMBNAILS.travel2,
    hook: "We sold everything and bought a van",
    caption: "Week one: 3 flat tyres, 2 sunsets, 0 regrets 🚐",
    hashtags: ["#vanlife", "#roadtrip", "#travelreels", "#nomad"],
    audio: "Wanderer · Acoustic",
  },
  {
    n: 27,
    title: "Unboxing: studio headphones",
    thumbnail: THUMBNAILS.product2,
    hook: "These cost less than your AirPods",
    caption: "Honest review after 2 weeks. Sound test at the end 🎧",
    hashtags: ["#unboxing", "#headphones", "#techreview", "#audio"],
    audio: "Bass Check · Studio Mix",
  },
];

const STAGE_FOR: Record<number, { stage: WorkerRole; workerId: string | null }> = {
  16: { stage: "analysing", workerId: null },
  17: { stage: "analysing", workerId: null },
  18: { stage: "analysing", workerId: null },
  19: { stage: "analysing", workerId: "w-analysing" },
  20: { stage: "publishing", workerId: "w-publishing" },
  21: { stage: "editing", workerId: "w-editing" },
  22: { stage: "copywriting", workerId: "w-copywriting" },
  23: { stage: "strategy", workerId: "w-strategy" },
  24: { stage: "research", workerId: "w-research" },
  25: { stage: "research", workerId: null },
  26: { stage: "research", workerId: null },
  27: { stage: "copywriting", workerId: "w-copywriting" },
};

const PUBLISHED_STATS: Record<number, ReelStats> = {
  16: { views: 48210, likes: 3920, comments: 214, shares: 611, saves: 1880 },
  17: { views: 126400, likes: 11230, comments: 742, shares: 2210, saves: 6540 },
  18: { views: 83950, likes: 7140, comments: 388, shares: 1490, saves: 4120 },
  19: { views: 9820, likes: 812, comments: 47, shares: 96, saves: 302 },
};

const PIPELINE: WorkerRole[] = ["research", "strategy", "copywriting", "editing", "publishing", "analysing"];
const ACTIONS: Record<WorkerRole, string> = {
  research: "Found trending audio & hook",
  strategy: "Locked angle, hook timing & CTA",
  copywriting: "Wrote on-screen text & caption",
  editing: "Cut clips & burned in captions",
  publishing: "Published to Instagram",
  analysing: "Wrapped performance report",
  custom: "Completed custom step",
};

export function stageAction(role: WorkerRole) {
  return ACTIONS[role];
}

export function createDefaultReels(now: number = Date.now()): Reel[] {
  const hour = 3_600_000;
  return SEEDS.map((s, i) => {
    const { stage, workerId } = STAGE_FOR[s.n];
    const stageIdx = PIPELINE.indexOf(stage);
    const isDone = workerId === null && stage === "analysing";
    const reachedStages = isDone ? PIPELINE.length : workerId ? stageIdx : 0;
    const base = now - (12 - i) * 30 * hour;
    const history = PIPELINE.slice(0, reachedStages).map((role, k) => ({
      workerId: `w-${role}`,
      action: ACTIONS[role],
      at: new Date(base + k * 2.5 * hour).toISOString(),
    }));
    const published = s.n <= 19;
    return {
      id: `reel-${s.n}`,
      number: s.n,
      title: s.title,
      thumbnail: s.thumbnail,
      hook: s.hook,
      caption: s.caption,
      hashtags: s.hashtags,
      audio: s.audio,
      stage,
      workerId,
      scheduledAt: published
        ? new Date(base + 11 * hour).toISOString()
        : s.n === 20
          ? new Date(now + 4 * hour).toISOString()
          : undefined,
      publishedAt: published ? new Date(s.n === 19 ? now - 2 * hour : base + 11 * hour).toISOString() : undefined,
      completedAt: isDone ? new Date(base + 14 * hour).toISOString() : undefined,
      stats: PUBLISHED_STATS[s.n],
      history,
    } satisfies Reel;
  });
}

/** Ideas the Research worker "discovers" when it runs out of work. */
export const IDEA_POOL: Omit<Seed, "n">[] = [
  {
    title: "Desk setup under ₹20k",
    thumbnail: THUMBNAILS.tech,
    hook: "My entire desk setup costs less than a phone",
    caption: "Every item linked in bio. Which one would you buy first?",
    hashtags: ["#desksetup", "#budgettech", "#wfh"],
    audio: "Clean Room · Lo-fi",
  },
  {
    title: "Protein oats in 3 minutes",
    thumbnail: THUMBNAILS.food2,
    hook: "30g protein breakfast, no powder",
    caption: "Meal-prep this on Sunday and win the whole week 🥣",
    hashtags: ["#highprotein", "#breakfast", "#mealprep"],
    audio: "Morning Sun · Acoustic",
  },
  {
    title: "Ladakh on a budget",
    thumbnail: THUMBNAILS.motivation2,
    hook: "7 days in Ladakh for under ₹25,000",
    caption: "Full itinerary in the caption. Save before you plan 🏔️",
    hashtags: ["#ladakh", "#budgettravel", "#mountains"],
    audio: "Open Roads · Cinematic",
  },
  {
    title: "The 2-minute stretch routine",
    thumbnail: THUMBNAILS.fitness2,
    hook: "Sitting all day? Do this before bed",
    caption: "Your back will thank you. Send this to your desk-job friend.",
    hashtags: ["#stretching", "#mobility", "#deskjob"],
    audio: "Calm Flow · Ambient",
  },
  {
    title: "Office interns be like",
    thumbnail: THUMBNAILS.comedy2,
    hook: "POV: it's the intern's first day",
    caption: "We've all been there 😭 Tag your work bestie",
    hashtags: ["#officecomedy", "#relatable", "#corporatelife"],
    audio: "Awkward Silence · Meme audio",
  },
  {
    title: "How we light a product shot",
    thumbnail: THUMBNAILS.bts2,
    hook: "One light. Three setups. Watch the difference.",
    caption: "Lighting is 80% of the shot. Save for your next shoot 💡",
    hashtags: ["#productphotography", "#lighting", "#bts"],
    audio: "Shutter · Original audio",
  },
];
