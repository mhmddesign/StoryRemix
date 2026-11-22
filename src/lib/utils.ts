import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRemaining(deadlineStr: string): {
  formatted: string;
  isExpired: boolean;
  totalSeconds: number;
} {
  const deadline = new Date(deadlineStr).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return { formatted: "Deadline reached", isExpired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return { formatted: `${days}d ${remHours}h left`, isExpired: false, totalSeconds };
  }

  if (hours > 0) {
    return { formatted: `${hours}h ${minutes}m left`, isExpired: false, totalSeconds };
  }

  return { formatted: `${minutes}m ${seconds}s left`, isExpired: false, totalSeconds };
}

export function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base.slice(0, 40) || "story"}-${randomSuffix}`;
}
