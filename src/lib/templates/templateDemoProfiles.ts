import type { TemplateStyle } from "../resumeTemplateCatalog";
import { TEMPLATE_DEFINITION_LIST } from "./tokens";
import type { TemplateDemoLocale } from "./templateDemoLocale";

export interface TemplateDemoProfile {
  title: string;
  summaryLead: string;
  summaryFocus: string;
}

const MODERN_PROFILES_EN: TemplateDemoProfile[] = [
  {
    title: "Frontend Product Engineer",
    summaryLead: "Product-minded frontend engineer shipping React and TypeScript experiences for Hong Kong and APAC users.",
    summaryFocus: "Design systems, accessible UI, and measurable delivery impact.",
  },
  {
    title: "Senior UI Engineer",
    summaryLead: "UI engineer focused on editorial layouts, typography rhythm, and crisp component APIs.",
    summaryFocus: "Turning complex workflows into calm, readable interfaces.",
  },
  {
    title: "Design Systems Engineer",
    summaryLead: "Engineer bridging design tokens, component libraries, and production React surfaces.",
    summaryFocus: "Consistent visual language across admin, marketing, and analytics products.",
  },
  {
    title: "Full-Stack Product Developer",
    summaryLead: "Full-stack developer building merchant tooling with React, Node.js, and cloud-native services.",
    summaryFocus: "End-to-end ownership from API design to polished UI states.",
  },
  {
    title: "Lead Frontend Developer",
    summaryLead: "Lead frontend developer guiding squads through migrations, performance budgets, and release quality.",
    summaryFocus: "Mentorship, code review culture, and predictable delivery cadence.",
  },
  {
    title: "Creative Technologist",
    summaryLead: "Creative technologist crafting interactive dashboards and brand-forward product surfaces.",
    summaryFocus: "Motion, micro-interactions, and storytelling through data visualization.",
  },
  {
    title: "Platform UI Engineer",
    summaryLead: "Platform engineer improving shared UI infrastructure, build pipelines, and developer experience.",
    summaryFocus: "Reusable primitives that accelerate feature teams without sacrificing craft.",
  },
  {
    title: "Product Engineer — Growth",
    summaryLead: "Growth-oriented engineer optimizing onboarding, activation funnels, and experimentation tooling.",
    summaryFocus: "A/B testing infrastructure paired with accessible, conversion-aware UI.",
  },
  {
    title: "Frontend Architect",
    summaryLead: "Frontend architect defining module boundaries, state management patterns, and rendering strategy.",
    summaryFocus: "Scalable architecture for multi-market SaaS with strong TypeScript contracts.",
  },
  {
    title: "Web Performance Engineer",
    summaryLead: "Performance engineer profiling Core Web Vitals, bundle budgets, and server/client rendering trade-offs.",
    summaryFocus: "Faster dashboards for large datasets without sacrificing clarity.",
  },
  {
    title: "Staff Frontend Engineer",
    summaryLead: "Staff engineer partnering with design and product to raise the bar on craft and reliability.",
    summaryFocus: "Cross-team initiatives, technical RFCs, and production incident follow-through.",
  },
];

const MODERN_PROFILES_ZH: TemplateDemoProfile[] = [
  {
    title: "前端產品工程師",
    summaryLead: "具產品思維的前端工程師，為香港及亞太用戶交付 React 與 TypeScript 體驗。",
    summaryFocus: "專精設計系統、無障礙介面與可量化的交付成果。",
  },
  {
    title: "資深 UI 工程師",
    summaryLead: "專注編輯式版面、字級節奏與清晰元件 API 的 UI 工程師。",
    summaryFocus: "將複雜流程轉化為沉穩、易讀的操作介面。",
  },
  {
    title: "設計系統工程師",
    summaryLead: "連結 Design Token、元件庫與正式環境 React 介面的工程師。",
    summaryFocus: "在後台、行銷與分析產品間維持一致的視覺語言。",
  },
  {
    title: "全端產品開發工程師",
    summaryLead: "以 React、Node.js 與雲端服務建構商戶工具的開發者。",
    summaryFocus: "從 API 設計到精緻 UI 狀態的全流程負責。",
  },
  {
    title: "前端開發組長",
    summaryLead: "帶領小組完成遷移、效能預算與發布品質的前端組長。",
    summaryFocus: "重視指導、Code Review 文化與可預期的交付節奏。",
  },
  {
    title: "創意技術工程師",
    summaryLead: "打造互動儀表板與具品牌感產品介面的創意技術工程師。",
    summaryFocus: "動效、微互動與數據視覺化敘事。",
  },
  {
    title: "平台 UI 工程師",
    summaryLead: "改善共用 UI 基礎設施、建置流程與開發者體驗的平台工程師。",
    summaryFocus: "可重用基礎元件，加速功能團隊而不犧牲品質。",
  },
  {
    title: "產品工程師 — 成長",
    summaryLead: "優化 onboarding、激活漏斗與實驗工具的成長導向工程師。",
    summaryFocus: "A/B 測試基礎建設搭配無障礙、轉換導向 UI。",
  },
  {
    title: "前端架構師",
    summaryLead: "定義模組邊界、狀態管理模式與渲染策略的前端架構師。",
    summaryFocus: "多市場 SaaS 的可擴展架構與嚴謹 TypeScript 合約。",
  },
  {
    title: "網頁效能工程師",
    summaryLead: "分析 Core Web Vitals、bundle 預算與 SSR/CSR 權衡的效能工程師。",
    summaryFocus: "在大量資料儀表板中提升速度而不損失清晰度。",
  },
  {
    title: "資深前端工程師",
    summaryLead: "與設計、產品協作，提升工程品質與可靠度的 Staff 工程師。",
    summaryFocus: "跨團隊專案、技術 RFC 與正式環境事故後續。",
  },
];

const CLASSIC_PROFILES_EN: TemplateDemoProfile[] = [
  {
    title: "Software Engineer — Applications",
    summaryLead: "Applications engineer with a conservative, ATS-friendly presentation and clear achievement metrics.",
    summaryFocus: "Stable releases, regression prevention, and stakeholder-ready documentation.",
  },
  {
    title: "Senior Software Developer",
    summaryLead: "Senior developer delivering enterprise dashboards, reporting modules, and integration layers.",
    summaryFocus: "Readable code, structured delivery, and dependable cross-functional communication.",
  },
  {
    title: "Technical Lead — Web Platform",
    summaryLead: "Technical lead coordinating roadmap delivery for internal web platforms and shared services.",
    summaryFocus: "Risk-managed rollouts, runbooks, and operational excellence.",
  },
  {
    title: "Principal Engineer — Frontend",
    summaryLead: "Principal engineer setting engineering standards for large React codebases and release trains.",
    summaryFocus: "Architecture reviews, quality gates, and long-term maintainability.",
  },
  {
    title: "Engineering Manager — Product UI",
    summaryLead: "Engineering manager balancing people leadership with hands-on UI architecture guidance.",
    summaryFocus: "Hiring, career growth, and predictable quarterly outcomes.",
  },
  {
    title: "Solutions Engineer",
    summaryLead: "Solutions engineer translating client requirements into implementable product specifications.",
    summaryFocus: "Pre-sales demos, proof-of-concept builds, and smooth handoff to delivery teams.",
  },
  {
    title: "Integration Engineer",
    summaryLead: "Integration engineer connecting CRM, billing, and analytics systems through robust APIs.",
    summaryFocus: "Data integrity, observability, and pragmatic error handling.",
  },
  {
    title: "Quality Engineering Lead",
    summaryLead: "Quality lead establishing automated regression suites for customer-facing web applications.",
    summaryFocus: "Playwright coverage, release checklists, and defect trend analysis.",
  },
  {
    title: "Programmer Analyst",
    summaryLead: "Programmer analyst modernizing legacy intranet tools into responsive React modules.",
    summaryFocus: "Incremental migration, user training, and change management.",
  },
  {
    title: "IT Applications Specialist",
    summaryLead: "Applications specialist supporting business units with custom workflow and reporting tools.",
    summaryFocus: "Requirements gathering, SLA adherence, and knowledge base upkeep.",
  },
];

const CLASSIC_PROFILES_ZH: TemplateDemoProfile[] = [
  {
    title: "應用程式軟體工程師",
    summaryLead: "以保守、ATS 友善格式呈現，並以明確量化成果為重的應用工程師。",
    summaryFocus: "穩定發布、迴歸防護與利害關係人可讀的文件。",
  },
  {
    title: "資深軟體開發工程師",
    summaryLead: "交付企業儀表板、報表模組與整合層的資深開發者。",
    summaryFocus: "可讀程式碼、結構化交付與可靠的跨職能溝通。",
  },
  {
    title: "技術主管 — 網頁平台",
    summaryLead: "協調內部網頁平台與共用服務路線圖交付的技術主管。",
    summaryFocus: "風險控管上線、Runbook 與營運卓越。",
  },
  {
    title: "首席工程師 — 前端",
    summaryLead: "為大型 React 程式庫與發布節奏訂立工程標準的首席工程師。",
    summaryFocus: "架構審查、品質關卡與長期可維護性。",
  },
  {
    title: "工程經理 — 產品 UI",
    summaryLead: "平衡人員管理與 UI 架構指導的工程經理。",
    summaryFocus: "招募、職涯發展與可預期的季度成果。",
  },
  {
    title: "解決方案工程師",
    summaryLead: "將客戶需求轉化為可實作產品規格的解決方案工程師。",
    summaryFocus: "售前 Demo、PoC 建置與順暢的交付交接。",
  },
  {
    title: "整合工程師",
    summaryLead: "透過穩健 API 串接 CRM、帳務與分析系統的整合工程師。",
    summaryFocus: "資料完整性、可觀測性與務實的錯誤處理。",
  },
  {
    title: "品質工程組長",
    summaryLead: "為面向客戶的網頁應用建立自動化迴歸測試的品質組長。",
    summaryFocus: "Playwright 覆蓋率、發布檢查清單與缺陷趨勢分析。",
  },
  {
    title: "程式分析師",
    summaryLead: "將舊版內網工具現代化為響應式 React 模組的程式分析師。",
    summaryFocus: "漸進式遷移、使用者培訓與變革管理。",
  },
  {
    title: "IT 應用專員",
    summaryLead: "為各事業單位支援自訂流程與報表工具的應用專員。",
    summaryFocus: "需求訪談、SLA 遵循與知識庫維護。",
  },
];

const MINIMALIST_PROFILES_EN: TemplateDemoProfile[] = [
  {
    title: "Product Designer — UI Engineering",
    summaryLead: "Designer-engineer hybrid shaping whitespace-driven product UI with systematic typography.",
    summaryFocus: "Minimal layouts that still communicate hierarchy and trust.",
  },
  {
    title: "UX Engineer",
    summaryLead: "UX engineer prototyping flows in code and shipping production-ready React components.",
    summaryFocus: "Research-informed interaction design with fast iteration loops.",
  },
  {
    title: "Interface Developer",
    summaryLead: "Interface developer crafting calm admin tools with strong grid discipline and neutral palettes.",
    summaryFocus: "Clarity over decoration; every pixel earns its place.",
  },
  {
    title: "Design Ops Engineer",
    summaryLead: "Design ops engineer connecting Figma libraries to coded tokens and CI visual checks.",
    summaryFocus: "Single source of truth for color, spacing, and component variants.",
  },
  {
    title: "Frontend Engineer — SaaS",
    summaryLead: "SaaS frontend engineer building settings, billing, and onboarding with restrained visual language.",
    summaryFocus: "Predictable patterns users can scan in seconds.",
  },
  {
    title: "Web Developer — Studio Practice",
    summaryLead: "Studio-minded developer delivering portfolio-grade marketing sites and product landing pages.",
    summaryFocus: "Responsive grids, subtle motion, and accessible contrast.",
  },
  {
    title: "Product Engineer — Mobile Web",
    summaryLead: "Product engineer optimizing mobile-first dashboards for field teams across APAC.",
    summaryFocus: "Touch targets, offline-tolerant states, and lightweight bundles.",
  },
  {
    title: "UI Developer — Analytics",
    summaryLead: "UI developer presenting dense analytics with generous margins and typographic hierarchy.",
    summaryFocus: "Tables, filters, and charts that remain legible under load.",
  },
  {
    title: "Creative Developer",
    summaryLead: "Creative developer experimenting with monospace accents and editorial grid systems.",
    summaryFocus: "Distinctive but readable interfaces for developer-facing products.",
  },
  {
    title: "Digital Product Builder",
    summaryLead: "Product builder launching MVPs quickly while maintaining a polished, gallery-like presentation.",
    summaryFocus: "Scope discipline, user feedback loops, and craft in the details.",
  },
];

const MINIMALIST_PROFILES_ZH: TemplateDemoProfile[] = [
  {
    title: "產品設計師 — UI 工程",
    summaryLead: "設計與工程雙修，以留白與系統化字級塑造產品 UI。",
    summaryFocus: "極簡版面仍能傳達層級與信任感。",
  },
  {
    title: "UX 工程師",
    summaryLead: "以程式碼原型化流程並交付可上線 React 元件的 UX 工程師。",
    summaryFocus: "研究驅動的互動設計與快速迭代。",
  },
  {
    title: "介面開發工程師",
    summaryLead: "以嚴謹格線與中性色調打造沉穩後台工具的介面開發者。",
    summaryFocus: "清晰優於裝飾；每個像素都有存在理由。",
  },
  {
    title: "設計營運工程師",
    summaryLead: "連結 Figma 函式庫、程式 Token 與 CI 視覺檢查的設計營運工程師。",
    summaryFocus: "色彩、間距與元件變體的單一事實來源。",
  },
  {
    title: "前端工程師 — SaaS",
    summaryLead: "以克制視覺語言建構設定、帳務與 onboarding 的 SaaS 前端工程師。",
    summaryFocus: "使用者數秒內可掃讀的可預期模式。",
  },
  {
    title: "網頁開發工程師 — 工作室",
    summaryLead: "交付作品集級行銷網站與產品著陸頁的工作室型開發者。",
    summaryFocus: "響應式格線、細緻動效與無障礙對比。",
  },
  {
    title: "產品工程師 — 行動網頁",
    summaryLead: "為亞太外勤團隊優化行動優先儀表板的產品工程師。",
    summaryFocus: "觸控目標、離線容錯狀態與輕量 bundle。",
  },
  {
    title: "UI 開發工程師 — 分析",
    summaryLead: "以寬裕邊距與字級層級呈現高密度分析介面的 UI 開發者。",
    summaryFocus: "高負載下仍清晰的表格、篩選與圖表。",
  },
  {
    title: "創意開發工程師",
    summaryLead: "探索等寬字強調與編輯格線系統的創意開發者。",
    summaryFocus: "面向開發者產品的獨特但可讀介面。",
  },
  {
    title: "數位產品建構者",
    summaryLead: "快速推出 MVP 同時維持精緻、畫廊感呈現的產品建構者。",
    summaryFocus: "範圍紀律、使用者回饋迴圈與細節工藝。",
  },
];

const PROFILES_BY_LOCALE: Record<TemplateDemoLocale, Record<TemplateStyle, TemplateDemoProfile>> = {
  en: {} as Record<TemplateStyle, TemplateDemoProfile>,
  zh: {} as Record<TemplateStyle, TemplateDemoProfile>,
};

function familyProfiles(family: string, locale: TemplateDemoLocale): TemplateDemoProfile[] {
  if (family === "classic") return locale === "zh" ? CLASSIC_PROFILES_ZH : CLASSIC_PROFILES_EN;
  if (family === "minimalist") return locale === "zh" ? MINIMALIST_PROFILES_ZH : MINIMALIST_PROFILES_EN;
  return locale === "zh" ? MODERN_PROFILES_ZH : MODERN_PROFILES_EN;
}

for (const locale of ["en", "zh"] as const) {
  for (const def of TEMPLATE_DEFINITION_LIST) {
    const index = Number(def.id.split("-")[1]) - 1;
    const profiles = familyProfiles(def.family, locale);
    PROFILES_BY_LOCALE[locale][def.id] = profiles[index] ?? profiles[0]!;
  }
}

/** @deprecated Use getTemplateDemoProfile(style, locale) */
export const TEMPLATE_DEMO_PROFILES: Record<TemplateStyle, TemplateDemoProfile> = PROFILES_BY_LOCALE.en;

export function getTemplateDemoProfile(style: TemplateStyle, locale: TemplateDemoLocale = "en"): TemplateDemoProfile {
  return PROFILES_BY_LOCALE[locale][style] ?? PROFILES_BY_LOCALE.en["modern-01"]!;
}

export function getTemplateDemoProfilesForLocale(locale: TemplateDemoLocale): Record<TemplateStyle, TemplateDemoProfile> {
  return PROFILES_BY_LOCALE[locale];
}
