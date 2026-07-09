import type { ResumeData } from "../../types";
import type { TemplateDemoLocale } from "./templateDemoLocale";

const EN_BASE: ResumeData = {
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
  summary: "",
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
        "Built a shared component library and token system adopted across admin, analytics, and marketing surfaces.",
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
        "Delivered internal order and catalog tooling with React, Node.js, and REST APIs for three APAC markets.",
        "Migrated legacy jQuery modules to TypeScript with shared Tailwind utilities and Storybook documentation.",
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
      description:
        "Kanban planning tool with drag-and-drop boards, command palette actions, and keyboard-first workflows for distributed teams.",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk",
    },
    {
      id: "proj-2",
      name: "Token Studio",
      description:
        "Design-token explorer that syncs Figma variables to CSS custom properties and documents contrast ratios for each theme.",
      techStack: "Next.js, TypeScript, Figma API",
      url: "https://github.com/alexchan/token-studio",
    },
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility (WCAG 2.1)",
    "REST APIs",
    "GraphQL",
    "Playwright",
    "Storybook",
    "Vite",
    "Performance Profiling",
    "Git & CI/CD",
    "Cantonese",
    "English",
  ],
  certifications: [
    "AWS Certified Cloud Practitioner (2023)",
    "Meta Front-End Developer Professional Certificate (2022)",
  ],
  volunteerWork: [
    "Code for Hong Kong — mentor for weekend React workshops (2021–Present)",
  ],
  languages: ["English (Fluent)", "Cantonese (Native)", "Mandarin (Conversational)"],
};

const ZH_BASE: ResumeData = {
  personalInfo: {
    name: "陳俊樂",
    title: "前端產品工程師",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "https://alexchan.dev",
    location: "香港特別行政區",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "香港永久性居民",
    noticePeriod: "1 個月",
    expectedSalary: "HK$42,000 / 月",
  },
  summary: "",
  experience: [
    {
      id: "exp-1",
      company: "海港數碼方案",
      role: "前端產品工程師",
      startDate: "2022-08",
      endDate: "Present",
      location: "香港鰂魚涌",
      bullets: [
        "以 React 與 TypeScript 重構商戶營運工作台，支援工單處理時間縮短 22%。",
        "建立共用元件庫與 Design Token 系統，應用於後台、分析與行銷介面。",
        "與設計團隊合作交付符合 WCAG 2.1 AA 的表格、篩選與表單元件。",
      ],
    },
    {
      id: "exp-2",
      company: "九龍商雲科技",
      role: "軟體工程師",
      startDate: "2020-07",
      endDate: "2022-07",
      location: "香港九龍灣",
      bullets: [
        "以 React、Node.js 與 REST API 交付內部訂單與型錄工具，支援三個亞太市場。",
        "以儀表板模組取代試算表報表，營運與財務團隊每週固定使用。",
        "將舊版 jQuery 模組遷移至 TypeScript，並以 Tailwind 與 Storybook 建立共用規範。",
      ],
    },
    {
      id: "exp-3",
      company: "珠江金融科技",
      role: "初級前端開發工程師",
      startDate: "2019-01",
      endDate: "2020-06",
      location: "香港中環",
      bullets: [
        "為受監管金融科技產品實作帳戶設定、KYC 流程與通知中心。",
        "與後端工程師協作 OpenAPI 合約與付款狀態的 optimistic UI。",
        "撰寫 React 測試模式內部 wiki，獲兩個功能小隊採用。",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "香港理工大學",
      degree: "理學士",
      field: "計算機",
      gradDate: "2021-06",
      location: "香港紅磡",
    },
    {
      id: "edu-2",
      institution: "香港大學專業進修學院",
      degree: "專業證書",
      field: "UX 設計與前端開發",
      gradDate: "2019-08",
      location: "香港金鐘",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard HK",
      description: "看板規劃工具，支援拖放欄位、指令面板與鍵盤優先操作，適合分散式團隊。",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk",
    },
    {
      id: "proj-2",
      name: "Token Studio",
      description: "Design Token 探索器，同步 Figma 變數至 CSS 自訂屬性，並記錄各主題對比度。",
      techStack: "Next.js, TypeScript, Figma API",
      url: "https://github.com/alexchan/token-studio",
    },
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "設計系統",
    "無障礙（WCAG 2.1）",
    "REST API",
    "GraphQL",
    "Playwright",
    "Storybook",
    "Vite",
    "效能分析",
    "Git 與 CI/CD",
    "粵語",
    "英語",
  ],
  certifications: [
    "AWS Certified Cloud Practitioner（2023）",
    "Meta 前端開發專業證書（2022）",
  ],
  volunteerWork: [
    "Code for Hong Kong — 週末 React 工作坊導師（2021–至今）",
  ],
  languages: ["英語（流利）", "粵語（母語）", "普通話（日常會話）"],
};

export const TEMPLATE_DEMO_SUMMARY_TAIL: Record<TemplateDemoLocale, string> = {
  en: "Four years of shipping production UI for cross-functional product teams.",
  zh: "擁有四年前端產品交付經驗，長期與跨職能團隊協作。",
};

export function buildTwoPageBaseResume(locale: TemplateDemoLocale): ResumeData {
  return locale === "zh" ? structuredClone(ZH_BASE) : structuredClone(EN_BASE);
}
