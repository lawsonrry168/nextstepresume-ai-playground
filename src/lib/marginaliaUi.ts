export type ScoreTone = "high" | "mid" | "low";

export function getScoreTone(score: number): ScoreTone {
  if (score >= 75) return "high";
  if (score >= 45) return "mid";
  return "low";
}

export const scoreBadgeClass: Record<ScoreTone, string> = {
  high: "score-badge score-badge--high",
  mid: "score-badge score-badge--mid",
  low: "score-badge score-badge--low",
};

export const scoreBarClass: Record<ScoreTone, string> = {
  high: "score-bar score-bar--high",
  mid: "score-bar score-bar--mid",
  low: "score-bar score-bar--low",
};

export const scoreTextClass: Record<ScoreTone, string> = {
  high: "score-text score-text--high",
  mid: "score-text score-text--mid",
  low: "score-text score-text--low",
};

export const toggleActiveClass = "btn-toggle-active";
export const toggleInactiveClass = "btn-toggle-inactive";
export const segmentActiveClass = "btn-segment-active";
export const segmentIdleClass = "btn-segment-idle";
export const fieldCardClass = "field-card";
export const selectFieldClass = "select-field";

export function fieldSurface(variant: "light" | "dark"): string {
  return variant === "dark" ? "border-slate-700 bg-slate-900/50" : fieldCardClass;
}
