import { CreativePathType } from "@/types/database";

export const XP_CONFIG = {
  PUBLISH_STORY: 25,
  SUBMIT_CONTINUATION: 10,
  WIN_ROUND: 25,
  COMPLETE_STORY: 40,
  CAST_VOTE: 2,
  WEEKLY_CHALLENGE: 20,
  REMIX_STORY: 25,
  COLLAB_MILESTONE: 30,
} as const;

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  nextLevelXp: number | null;
  progressPercent: number;
  badgeIcon: string;
}

export const LEVELS = [
  { level: 1, title: "Newcomer", xpRequired: 0, badgeIcon: "Sprout" },
  { level: 2, title: "Scribbler", xpRequired: 100, badgeIcon: "Feather" },
  { level: 3, title: "Storyteller", xpRequired: 250, badgeIcon: "BookOpen" },
  { level: 4, title: "Wordsmith", xpRequired: 500, badgeIcon: "PenTool" },
  { level: 5, title: "Storyweaver", xpRequired: 900, badgeIcon: "Scroll" },
  { level: 6, title: "Lorekeeper", xpRequired: 1500, badgeIcon: "Compass" },
  { level: 7, title: "Master Writer", xpRequired: 2400, badgeIcon: "Award" },
  { level: 8, title: "Mythmaker", xpRequired: 3600, badgeIcon: "Flame" },
  { level: 9, title: "Legendary Author", xpRequired: 5200, badgeIcon: "Crown" },
  { level: 10, title: "Living Legend", xpRequired: 7200, badgeIcon: "Sparkles" },
];

export function calculateLevel(lifetimeXp: number): LevelInfo {
  let currentLevelObj = LEVELS[0];
  let nextLevelObj = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i++) {
    if (lifetimeXp >= LEVELS[i].xpRequired) {
      currentLevelObj = LEVELS[i];
      nextLevelObj = LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  if (!nextLevelObj) {
    return {
      level: currentLevelObj.level,
      title: currentLevelObj.title,
      xpRequired: currentLevelObj.xpRequired,
      nextLevelXp: null,
      progressPercent: 100,
      badgeIcon: currentLevelObj.badgeIcon,
    };
  }

  const currentLevelBase = currentLevelObj.xpRequired;
  const nextLevelBase = nextLevelObj.xpRequired;
  const span = nextLevelBase - currentLevelBase;
  const gained = Math.max(0, lifetimeXp - currentLevelBase);
  const progressPercent = Math.min(100, Math.round((gained / span) * 100));

  return {
    level: currentLevelObj.level,
    title: currentLevelObj.title,
    xpRequired: currentLevelObj.xpRequired,
    nextLevelXp: nextLevelBase,
    progressPercent,
    badgeIcon: currentLevelObj.badgeIcon,
  };
}

export const CREATIVE_PATHS: Record<
  CreativePathType,
  { name: string; description: string; icon: string; motivation: string }
> = {
  storyteller: {
    name: "The Storyteller",
    description: "Plants genesis plots and orchestrates whole narrative universes.",
    icon: "Feather",
    motivation: "Inspire others to continue what you began.",
  },
  collaborator: {
    name: "The Collaborator",
    description: "Specializes in writing concise, gripping 2-3 sentence continuations.",
    icon: "PenTool",
    motivation: "Propel existing worlds forward with surprising twists.",
  },
  explorer: {
    name: "The Explorer",
    description: "Reads widely across multiple genres, following stories as they develop.",
    icon: "Compass",
    motivation: "Discover emerging voices and hidden gems.",
  },
  curator: {
    name: "The Curator",
    description: "Champions quality through diligent voting, bookmarking, and constructive feedback.",
    icon: "ThumbsUp",
    motivation: "Shape the democratic canon of community literature.",
  },
  worldbuilder: {
    name: "The Worldbuilder",
    description: "Explores alternative timelines by remixing completed stories.",
    icon: "GitFork",
    motivation: "Ask 'what if?' and weave branching multiverses.",
  },
  patron: {
    name: "The Patron",
    description: "Supports writers with encouragement, reactions, and awards.",
    icon: "Heart",
    motivation: "Nurture creativity and fuel literary careers.",
  },
};

export function evaluateCommunityArchetype(stats: {
  storiesCreated: number;
  continuationsSubmitted: number;
  votesCast: number;
  remixesCreated: number;
}): string {
  const { storiesCreated, continuationsSubmitted, votesCast, remixesCreated } = stats;

  if (remixesCreated >= 3) return "Multiverse Weaver";
  if (storiesCreated >= 5 && continuationsSubmitted < storiesCreated) return "Master Architect";
  if (continuationsSubmitted >= 10) return "Ensemble Virtuoso";
  if (votesCast >= 25 && continuationsSubmitted < 3) return "Discerning Critic";
  if (storiesCreated >= 1 && continuationsSubmitted >= 3) return "Versatile Collaborator";
  return "Emerging Scribe";
}
