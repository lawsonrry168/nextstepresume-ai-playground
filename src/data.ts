/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData } from "./types";
import { isHongKongMarket } from "./lib/market/config";
import { getDefaultTemplateDemoResume } from "./lib/templates/templateDemoContent";
import { readStoredUiLocale } from "./lib/templates/templateDemoLocale";

const HK_RESUME: ResumeData = {
  personalInfo: {
    name: "Alex Chan",
    title: "Frontend Product Engineer",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "https://alexchan.dev",
    location: "Hong Kong SAR",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "Permanent Hong Kong Resident",
    noticePeriod: "1 month",
    expectedSalary: "HK$42,000 / month",
  },
  summary:
    "Frontend engineer with 4 years shipping React and TypeScript products for Hong Kong and APAC teams. Focused on accessible UI, design systems, and measurable delivery impact.",
  experience: [
    {
      id: "exp-1",
      company: "Harbour Digital Solutions",
      role: "Frontend Product Engineer",
      startDate: "2022-08",
      endDate: "Present",
      location: "Quarry Bay, Hong Kong",
      bullets: [
        "Rebuilt a merchant operations workspace in React and TypeScript, cutting support task time by 22%.",
        "Built a shared component library and token system adopted across admin and analytics surfaces.",
      ],
    },
    {
      id: "exp-2",
      company: "Kowloon Commerce Cloud",
      role: "Software Engineer",
      startDate: "2020-07",
      endDate: "2022-07",
      location: "Kowloon Bay, Hong Kong",
      bullets: [
        "Delivered internal order and catalog tooling with React, Node.js, and REST APIs for three markets.",
        "Replaced manual spreadsheet reporting with dashboard modules used weekly by operations teams.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "The Hong Kong Polytechnic University",
      degree: "BSc",
      field: "Computing",
      gradDate: "2021-06",
      location: "Hung Hom, Hong Kong",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard HK",
      description: "Kanban planning tool with drag-and-drop boards and keyboard shortcuts.",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk",
    },
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "REST APIs",
    "Cantonese",
    "English",
  ],
  languages: ["English (Fluent)", "Cantonese (Native)", "Mandarin (Conversational)"],
};

const DEFAULT_RESUME: ResumeData = {
  personalInfo: {
    name: "Morgan Keats",
    title: "Senior Frontend Developer",
    email: "morgan.keats@proton.me",
    phone: "+1 (312) 847-1928",
    website: "https://morgankeats.dev",
    location: "Chicago, Illinois",
    linkedin: "linkedin.com/in/morgan-keats",
  },
  summary:
    "Frontend developer with 5 years building React dashboards, ecommerce journeys, and internal tools for product-led teams.",
  experience: [
    {
      id: "exp-1",
      company: "Northline Digital",
      role: "Senior Frontend Developer",
      startDate: "2022-02",
      endDate: "Present",
      location: "Chicago, IL (Hybrid)",
      bullets: [
        "Owned frontend delivery for a B2B operations suite used by sales and finance teams, shipping roadmap items across onboarding, reporting, and approvals workflows.",
        "Introduced reusable React patterns, table primitives, and token-based styling that made new feature delivery more predictable.",
      ],
    },
    {
      id: "exp-2",
      company: "Harborstack Labs",
      role: "Frontend Developer",
      startDate: "2020-06",
      endDate: "2022-01",
      location: "Remote",
      bullets: [
        "Built and maintained client-facing marketing sites, lead-capture journeys, and lightweight dashboards for startup clients.",
        "Helped migrate legacy UI to TypeScript and reusable Tailwind patterns, improving consistency across new builds.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Illinois Chicago",
      degree: "Bachelor of Science",
      field: "Computer Science",
      gradDate: "2023-05",
      location: "Chicago, IL",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard",
      description: "Kanban planning tool with drag-and-drop columns and command palette actions.",
      techStack: "React, TypeScript, Tailwind, DnD Kit",
      url: "https://github.com/morgankeats/sprintboard",
    },
  ],
  skills: [
    "JavaScript",
    "React.js",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "Git & GitHub",
    "REST APIs",
    "Jira",
    "Node.js",
  ],
  languages: ["English (Native)", "Spanish (Professional Working Proficiency)"],
};

/** Pre–two-page-demo placeholders; still treated as syncable default content. */
export const LEGACY_DEFAULT_RESUMES: ResumeData[] = [HK_RESUME, DEFAULT_RESUME];

export const initialResumeData: ResumeData = getDefaultTemplateDemoResume(readStoredUiLocale());

/** Compact sample resume for unit tests that expect single-page layout fit. */
export const compactResumeFixture: ResumeData = isHongKongMarket() ? HK_RESUME : DEFAULT_RESUME;

const HK_JOB_DESCRIPTION = `
Software Engineer (React / TypeScript) — Hong Kong

About the role:
We are hiring an engineer to grow our regional dashboard platform serving Hong Kong and APAC clients. You will build performant, accessible UI components and improve large data views.

Requirements:
- 3+ years building responsive SPAs in production.
- Strong TypeScript, React, and modern CSS (Tailwind preferred).
- Track record of measurable impact (performance, quality, or delivery metrics).
- Eligible to work in Hong Kong; fluent English; Cantonese a plus.
- Comfortable in Agile teams with cross-functional stakeholders.

Nice to have:
- Fintech or regulated industry experience.
- Experience with Vite, Node.js, and CI/CD pipelines.
`;

export const initialJobDescription = isHongKongMarket()
  ? HK_JOB_DESCRIPTION
  : `
Senior Frontend Engineer (React/TypeScript)

Job Description:
We are looking for an engineer to grow our enterprise dashboard platform. You will build fast, accessible UI components and help resolve performance bottlenecks on large data views.

Required Qualifications:
- 3+ years building responsive SPAs at product scale.
- Strong TypeScript, React Hooks, and Tailwind CSS experience.
- Track record of measurable impact (performance, velocity, or quality metrics).
- Comfort with modular architecture, profiling, and Vite-based builds.
`;

// API route catalog for architecture topology explorer
export const COMPILED_ENDPOINTS = [
  { path: "/api/resume/parse", method: "POST", localeKey: "parse" },
  { path: "/api/resume/parse-pdf", method: "POST", localeKey: "parsePdf" },
  { path: "/api/analyze", method: "POST", localeKey: "analyze" },
  { path: "/api/jobsdb/search", method: "POST", localeKey: "jobsdb" },
  { path: "/api/health", method: "GET", localeKey: "health" },
] as const;

/** @deprecated Prefer COMPILED_ENDPOINTS — only path/method remain for legacy imports */
export const reverseEngineeringOverview = {
  compiledEndpoints: COMPILED_ENDPOINTS.map(({ path, method }) => ({ path, method })),
};
