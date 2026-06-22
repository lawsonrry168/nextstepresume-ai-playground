import type { LucideIcon } from "lucide-react";
import { Award, Code, Layers, Sparkles, TrendingUp } from "lucide-react";

export interface ActionVerbCategory {
  key: string;
  name: string;
  icon: LucideIcon;
  badgeColor: string;
  activeColor: string;
  verbs: string[];
}

export const ACTION_VERB_CATEGORIES: ActionVerbCategory[] = [
  {
    key: "tech",
    name: "Technical & Engineering",
    icon: Code,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
    verbs: [
      "Architected", "Engineered", "Programmed", "Deployed", "Refactored", "Optimized",
      "Designed", "Formulated", "Automated", "Overhauled", "Debugging", "Interfaced",
      "Consolidated", "Streamlined", "Synthesized", "Configured",
    ],
  },
  {
    key: "leadership",
    name: "Leadership & Management",
    icon: Award,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    activeColor: "bg-rose-600 text-white border-rose-600",
    verbs: [
      "Spearheaded", "Led", "Directed", "Orchestrated", "Guided", "Chaired",
      "Championed", "Executed", "Cultivated", "Delegated", "Supervised", "Coordinated",
      "Pioneered", "Forged", "Mentored", "Advocated",
    ],
  },
  {
    key: "analysis",
    name: "Data & Analysis",
    icon: Layers,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    activeColor: "bg-amber-600 text-white border-amber-600",
    verbs: [
      "Analyzed", "Audited", "Deciphered", "Forecasted", "Evaluated", "Validated",
      "Interpreted", "Dissected", "Modelled", "Investigated", "Quantified", "Extracted",
      "Scrutinized", "Synthesized", "Diagnosed", "Mapped",
    ],
  },
  {
    key: "growth",
    name: "Business & Growth",
    icon: TrendingUp,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
    verbs: [
      "Accelerated", "Maximized", "Generated", "Negotiated", "Secured", "Captured",
      "Amplified", "Monetized", "Expanded", "Boosted", "Calculated", "Acquired",
      "Substantiated", "Synergized", "Outpaced", "Propelled",
    ],
  },
  {
    key: "innovation",
    name: "Product & Innovation",
    icon: Sparkles,
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
    activeColor: "bg-violet-600 text-white border-violet-600",
    verbs: [
      "Pioneered", "Launched", "Conceptualized", "Implemented", "Devised", "Originated",
      "Initiated", "Revitalized", "Incubated", "Translated", "Redesigned", "Disrupted",
      "Modernized", "Transformed", "Pioneered",
    ],
  },
];

export function getRecommendedVerbCategory(jobTitle: string): string {
  const currentTitle = jobTitle.toLowerCase();
  if (!currentTitle) return "tech";
  if (currentTitle.match(/engineer|developer|programmer|architect|tech|web|frontend|backend|fullstack|devops|cloud|data/)) {
    return "tech";
  }
  if (currentTitle.match(/manager|director|lead|head|product|scrum|chief|executive|vp|ceo/)) {
    return "leadership";
  }
  if (currentTitle.match(/analyst|finance|consultant|accountant|audit|business/)) {
    return "analysis";
  }
  if (currentTitle.match(/sales|marketing|growth|seo|brand|account/)) {
    return "growth";
  }
  return "innovation";
}
