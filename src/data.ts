/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData } from "./types";
import { isHongKongMarket } from "./lib/market/config";

const HK_RESUME: ResumeData = {
  personalInfo: {
    name: "Alex Chan",
    title: "Software Engineer",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "",
    location: "Hong Kong",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "Permanent Hong Kong Resident",
    noticePeriod: "1 month",
    expectedSalary: "HK$35,000 / month",
  },
  summary:
    "Software engineer with 3+ years delivering React and TypeScript products for regional users. Experienced in performance optimisation, design systems, and cross-functional delivery in Hong Kong and APAC teams. Seeking a product-focused role where code quality and user outcomes matter.",
  experience: [
    {
      id: "exp-1",
      company: "Harbour Digital Solutions",
      role: "Software Engineer",
      startDate: "2023-01",
      endDate: "Present",
      location: "Quarry Bay, Hong Kong (Hybrid)",
      bullets: [
        "Delivered reusable React components aligned with design tokens across three customer-facing surfaces.",
        "Reduced initial route load time by ~18% through code splitting on high-traffic dashboard pages.",
        "Partnered with product and QA in two-week sprints; maintained predictable release cadence.",
        "Introduced TypeScript interfaces and unit tests that cut regression bugs in core flows.",
      ],
    },
    {
      id: "exp-2",
      company: "Kowloon FinTech Labs",
      role: "Junior Developer",
      startDate: "2021-07",
      endDate: "2022-12",
      location: "Kowloon Bay, Hong Kong",
      bullets: [
        "Built internal tooling with Node.js and REST APIs supporting operations teams.",
        "Maintained marketing sites and validated form flows for lead capture campaigns.",
        "Collaborated with senior engineers on refactors and Jira-backed delivery.",
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
      description: "Kanban task board with drag-and-drop columns and local persistence.",
      techStack: "React, TypeScript, Tailwind CSS",
      url: "https://github.com/alexchan/sprintboard-hk",
    },
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Tailwind CSS",
    "REST APIs",
    "Git",
    "Agile / Scrum",
    "Cantonese",
    "English",
  ],
  languages: ["English (Fluent)", "Cantonese (Native)", "Mandarin (Conversational)"],
};

const DEFAULT_RESUME: ResumeData = {
  personalInfo: {
    name: "Morgan Keats",
    title: "Frontend Developer",
    email: "morgan.keats@proton.me",
    phone: "+1 (312) 847-1928",
    website: "https://morgankeats.dev",
    location: "Chicago, Illinois",
    linkedin: "linkedin.com/in/morgan-keats",
  },
  summary:
    "Frontend developer with 3+ years building React dashboards and customer-facing web apps. Comfortable with TypeScript, design systems, and cross-functional delivery. Looking for a product team where performance and accessibility matter.",
  experience: [
    {
      id: "exp-1",
      company: "Northline Digital",
      role: "Junior React Engineer",
      startDate: "2024-03",
      endDate: "Present",
      location: "Chicago, IL (Hybrid)",
      bullets: [
        "Shipped reusable React components aligned with Figma specs and design tokens.",
        "Reduced bug backlog by pairing with senior engineers on refactors and Jira triage.",
        "Integrated icon libraries and Tailwind utility patterns across three product surfaces.",
        "Cut initial route load time ~18% by splitting vendor bundles on high-traffic pages.",
      ],
    },
    {
      id: "exp-2",
      company: "Harborstack Labs",
      role: "Software Developer Intern",
      startDate: "2023-06",
      endDate: "2024-02",
      location: "Remote",
      bullets: [
        "Contributed to two-week sprints with daily standups and stakeholder demos.",
        "Maintained marketing landing pages and validated form submission flows.",
        "Adopted TypeScript interfaces, Tailwind layouts, and lightweight state patterns.",
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
      description: "Kanban-style task board with drag-and-drop columns and local persistence.",
      techStack: "React, Tailwind, HTML5 Drag-and-Drop",
      url: "https://github.com/morgankeats/sprintboard",
    },
  ],
  skills: [
    "JavaScript",
    "React.js",
    "TypeScript",
    "Tailwind CSS",
    "Git & GitHub",
    "REST APIs",
    "Jira",
    "Node.js",
    "Responsive Design",
  ],
};

export const initialResumeData: ResumeData = isHongKongMarket() ? HK_RESUME : DEFAULT_RESUME;

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
  { path: "/api/resume/download", method: "POST", localeKey: "download" },
] as const;

/** @deprecated Prefer COMPILED_ENDPOINTS — only path/method remain for legacy imports */
export const reverseEngineeringOverview = {
  compiledEndpoints: COMPILED_ENDPOINTS.map(({ path, method }) => ({ path, method })),
};
