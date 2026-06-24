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
    checkoutCta: "以 Stripe 訂閱",
    checkoutLoading: "正在前往結帳…",
    productionNote: "透過 Stripe（HKD）安全結帳，方案由付款 webhook 同步。",
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
  legal: {
    nav: {
      privacy: "私隱政策",
      terms: "服務條款",
      back: "返回應用程式",
      related: "法律文件",
    },
    privacy: {
      title: "私隱政策",
      updated: "最後更新：2026年6月24日 · 香港",
      sections: {
        intro: {
          title: "簡介",
          body:
            "NextStepResume.ai（「我們」）為香港用戶提供履歷優化與求職申請工具。本政策說明我們如何根據《個人資料（私隱）條例》（第486章）及香港個人資料私隱專員公署（PCPD）相關指引處理個人資料。",
        },
        collect: {
          title: "我們收集的資料",
          body:
            "我們可能收集：帳戶識別資料（透過 Supabase Auth 的電郵）、您輸入或上載的履歷與申請內容、使用與配額統計、Stripe 帳單元數據，以及營運與保安所需的技術紀錄（IP、瀏覽器類型、API 時間戳）。",
        },
        use: {
          title: "資料用途",
          body:
            "我們使用資料以提供 ATS 分析、AI 客製、JobsDB 匯入、匯出、雲端同步、訂閱收費及客戶支援。AI 功能僅在處理您的請求時，將相關履歷／職位描述文字傳送至設定的模型供應商（例如 Google Gemini）。我們不出售個人資料。",
        },
        storage: {
          title: "儲存與保留",
          body:
            "示範／Playground 模式可能將資料儲存在瀏覽器（localStorage）。登入並啟用雲端同步後，工作區資料會儲存於 PostgreSQL（Supabase）。我們會在帳戶有效期間及之後合理期限內保留資料，以符合法律、帳單或爭議需要，除非您依法要求刪除。",
        },
        thirdParties: {
          title: "服務供應商",
          body:
            "我們使用包括 Supabase（驗證與資料庫）、Stripe（HKD 付款）、Google Gemini（可選 AI）及 Apify（可選 JobsDB 搜尋）等子處理者。各供應商按其條款處理資料，且僅為您所使用的整合功能而處理。",
        },
        rights: {
          title: "您的權利",
          body:
            "您可要求查閱或更正個人資料，並在同意為法律依據時撤回對可選處理的同意。請使用下方聯絡方式提出私隱查詢。您亦可向香港 PCPD 作出投訴。",
        },
        contact: {
          title: "聯絡我們",
          body:
            "私隱查詢：privacy@nextstepresume.ai\n資料控制者：NextStepResume.ai（香港部署）\n我們會在合理時間內回覆已核實的請求。",
        },
      },
    },
    terms: {
      title: "服務條款",
      updated: "最後更新：2026年6月24日 · 香港",
      sections: {
        intro: {
          title: "協議",
          body:
            "使用 NextStepResume.ai 即表示您同意本條款。如不同意，請勿使用本服務。本條款適用於香港部署（HK$ 定價、JobsDB HK 整合、英式英文預設）。",
        },
        service: {
          title: "服務內容",
          body:
            "我們提供撰寫、客製、評分及匯出履歷與相關申請材料的軟件。功能因方案（Starter、Pro、Max）而異。我們可在需要時更新功能、限額或價格，並在適當情況下提供合理通知。",
        },
        accounts: {
          title: "帳戶與方案",
          body:
            "您須妥善保管登入憑證。訂閱狀態與配額以伺服器紀錄為準；正式環境下，付費方案須透過 Stripe 成功結帳。示範／Playground 模式可於本機模擬方案而無需付款。",
        },
        acceptableUse: {
          title: "可接受使用",
          body:
            "您不得濫用服務、試圖繞過配額或保安、上載違法內容，或以違反第三方網站條款（包括 JobsDB）的方式進行自動化擷取。您須對所匯入的履歷或職位描述擁有合法權利。",
        },
        ai: {
          title: "AI 免責聲明",
          body:
            "AI 建議僅供參考。您須在提交申請前自行審核準確性、合法性及適用性。我們不保證面試結果、ATS 通過率或錄取結果。",
        },
        billing: {
          title: "收費與退款",
          body:
            "付費訂閱一般透過 Stripe 以 HKD 收費，除非另有說明。除法律要求或購買時明確列明外，費用通常不予退款。您可透過 Stripe 客戶入口網站或應用程式內支援的流程取消續訂。",
        },
        liability: {
          title: "責任限制",
          body:
            "在香港法律允許的最大範圍內，我們不對因使用服務而產生的間接、附帶或相應損害負責。我們對任何索償的總責任上限為索償前十二（12）個月內您向我們支付的費用。",
        },
        law: {
          title: "適用法律",
          body:
            "本條款受香港特別行政區法律管轄。爭議由香港法院專屬管轄，但不影響強制性消費者保障。",
        },
      },
    },
  },
};

export default zhHK;
