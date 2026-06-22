import type { MessageTree } from "../types";

/** Hong Kong English UI overrides. */
const enHK: MessageTree = {
  brand: {
    slogan: "Ready for what's next? Craft your NextStep CV for Hong Kong — JobsDB-ready, British English.",
  },
  market: {
    banner: "🇭🇰 Hong Kong · JobsDB HK · British English · HK$ pricing",
    region: "Hong Kong",
  },
  billing: {
    pricingTitle: "Choose your NextStep plan (Hong Kong)",
    pricingSubtitle:
      "Start free on Starter; Pro unlocks JobsDB search, AI tailoring, and clean PDF exports; Max adds unlimited exports and Canvas Studio.",
    demoNote: "Demo mode: plan stored locally. Production will support Stripe (HKD) and a 30-day Job Search Pass (HK$128).",
    sprintPass: "30-day Job Search Pass",
    sprintPassPrice: "HK$128 one-off",
    sprintPassHint: "Ideal for a focused 1–2 month job search without a long subscription.",
    plans: {
      starter: {
        tagline: "Free CV editing, live ATS score, and watermarked PDF.",
      },
      pro: {
        tagline: "JobsDB search, AI tailor, full exports, tracker, and Gemini coach.",
      },
      max: {
        tagline: "Unlimited JobsDB search, Canvas Studio, Thinking mode, and exports.",
      },
    },
    highlights: {
      jobsdbSearch: "{{count}} JobsDB HK searches / month",
    },
    compare: {
      rows: {
        jobsdb: "JobsDB HK",
      },
    },
    upgrade: {
      reasons: {
        "import.jobsdb": "JobsDB search requires Pro or above.",
      },
    },
  },
  editor: {
    jobImport: {
      hint: "JobsDB HK / LinkedIn / CTgoodjobs — for SPA sites, paste the JD or use JobsDB search",
      modes: { url: "URL", paste: "Paste JD", jobsdb: "JobsDB HK" },
      searchJobsdb: "Search JobsDB HK",
    },
    fields: {
      rightToWork: "Right to work in HK",
      rightToWorkPlaceholder: "e.g. Permanent HK Resident / IANG / Requires sponsorship",
      noticePeriod: "Notice period",
      noticePeriodPlaceholder: "e.g. 1 month / Immediate",
      expectedSalary: "Expected salary (HKD/month)",
      expectedSalaryPlaceholder: "e.g. HK$35,000",
    },
    hkSection: {
      title: "Hong Kong CV details",
      hint: "Common fields for local HR — optional.",
    },
  },
  followUp: {
    whatsapp: "WhatsApp follow-up",
    whatsappHint: "Opens WhatsApp with a pre-filled follow-up message",
    whatsappOpen: "Follow up on WhatsApp",
  },
  tools: {
    salary: {
      regionLabel: "Hong Kong market (monthly HKD)",
      monthlyNote: "Figures are monthly base salary guides; bonus/MPF separate.",
    },
    atsCrawler: {
      sources: {
        jobsdb: "JobsDB HK",
        linkedin: "LinkedIn",
        ctgoodjobs: "CTgoodjobs",
      },
    },
  },
};

export default enHK;
