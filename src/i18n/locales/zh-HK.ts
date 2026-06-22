import type { MessageTree } from "../types";

/** Hong Kong UI overrides (merged onto en / zh-TW base). */
const zhHK: MessageTree = {
  brand: {
    slogan: "Ready for what's next? 為香港求職者打造 JobsDB 友善的 NextStep CV。",
  },
  market: {
    banner: "🇭🇰 香港版 · JobsDB HK · 英式英文 · HK$ 定價",
    region: "香港",
  },
  locale: {
    switchTo: "切換至 {{locale}}",
  },
  billing: {
    pricingTitle: "選擇你的 NextStep 方案（香港）",
    pricingSubtitle:
      "Starter 免費開始；Pro 解鎖 JobsDB 搜尋、AI 客製與無浮水印 PDF；Max 含無限匯出與 Canvas Studio。",
    demoNote: "示範模式：方案儲存於本機。正式版將支援 Stripe（HKD）及 30 天求職 Pass（HK$128）。",
    sprintPass: "30 天求職 Pass",
    sprintPassPrice: "HK$128 一次性",
    sprintPassHint: "適合集中 1–2 個月搵工，無需長期月費。",
    perMonth: "/ 月",
    plans: {
      starter: {
        tagline: "免費編輯 CV、即時 ATS 分數與浮水印 PDF。",
      },
      pro: {
        tagline: "JobsDB 搜尋、AI 客製、完整匯出、申請追蹤與 Gemini 導師。",
      },
      max: {
        tagline: "無限 JobsDB 搜尋、Canvas Studio、Thinking 模式與無限匯出。",
      },
    },
    highlights: {
      jobsdbSearch: "JobsDB HK 搜尋 {{count}} 次/月",
    },
    compare: {
      rows: {
        jobsdb: "JobsDB HK",
      },
    },
    upgrade: {
      reasons: {
        "import.jobsdb": "JobsDB 搜尋需要 Pro 或更高方案。",
      },
    },
  },
  editor: {
    jobImport: {
      hint: "JobsDB HK / LinkedIn / CTgoodjobs — SPA 網站請改貼 JD 全文或使用 JobsDB 搜尋",
      modes: { url: "URL", paste: "貼上 JD", jobsdb: "JobsDB HK" },
      searchJobsdb: "搜尋 JobsDB HK",
    },
    fields: {
      rightToWork: "在港工作資格",
      rightToWorkPlaceholder: "例如：香港永久性居民 / IANG / 需僱主贊助",
      noticePeriod: "通知期",
      noticePeriodPlaceholder: "例如：1 month / Immediate",
      expectedSalary: "期望月薪 (HKD)",
      expectedSalaryPlaceholder: "例如：HK$35,000",
      linkedin: "LinkedIn",
    },
    hkSection: {
      title: "香港履歷資料",
      hint: "本地 HR 常見欄位；可選填。",
    },
  },
  followUp: {
    whatsapp: "WhatsApp 跟進",
    whatsappHint: "開啟 WhatsApp 並預填跟進訊息（可再自行修改）",
    whatsappOpen: "用 WhatsApp 跟進",
  },
  tools: {
    salary: {
      regionLabel: "香港市場（月薪 HKD）",
      monthlyNote: "數字為每月基本薪金參考，年終/花紅另計。",
    },
    atsCrawler: {
      sources: {
        jobsdb: "JobsDB HK",
        linkedin: "LinkedIn",
        ctgoodjobs: "CTgoodjobs",
      },
    },
  },
  toast: {
    playground: {
      jobsdbKeywordRequired: "請輸入關鍵字（例：software engineer）或貼上 JobsDB 搜尋網址",
    },
  },
};

export default zhHK;
