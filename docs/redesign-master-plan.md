# NextStepResume 總體重寫方案（整合版）

> 整合三份分析：系統架構與匯出管線、Canvas Studio、31 款版型重新設計。
> 版型設計細節見 [template-redesign-31.md](./template-redesign-31.md)。

---

## 1. 統一診斷 — 所有問題指向同一個根因

系統的功能面（AI、追蹤器、計費、同步、JobsDB、i18n）架構健康，**不需要重寫**。
需要重寫的是「文件層」：同一份履歷版面，目前存在多套互不相通的實作。

| 病灶 | 位置 | 症狀 |
|---|---|---|
| 4 個獨立渲染器 | React 預覽 / html2canvas 截圖 PDF / jsPDF ATS / docx | 匯出與預覽版型不匹配（用戶最痛） |
| 31 款版型只有 4 個真實版面 | `resumeTemplateCatalog.ts` + 3 個 Document 元件 | 選版型只換色，輸出千篇一律 |
| 顏色鎖死在 Tailwind class 字串 | `"text-[#c0392b]"` | DOCX/PDF 讀不到 → 只有 3 套匯出調色盤 |
| 視覺 PDF 是點陣截圖 | ~~`resumePdfExport.ts`~~（已移除；改由 `resumePdfExportRouter` → 伺服器 Chromium 向量列印） | 舊點陣路徑文字不可選、ATS 不可讀 |
| 高度計算有 3 個版本 | 啟發式估算 / 瀏覽器實排 / clone 重量測 | 溢頁、跑版、留白錯位 |
| Canvas 狀態碎片化 | 4 個 localStorage store，以版型家族為 key | 只能一份履歷、雲端同步不完整 |
| Undo 不涵蓋版面 | `useResumeUndoHistory` 只快照 ResumeData | 拖動/縮放/套預設全部不可撤銷，且無 Redo |
| 頁面歸屬雙真相 | position.pageId vs pagesDoc + 對帳函數 | 跑頁 bug 溫床；「複製頁面」是假的 |

**統一解法：單一資料模型，所有畫面與匯出都是投影。**

```
ResumeData（內容）   TemplateDefinition（31 份 JSON token）   CanvasDocument（編輯狀態）
        └──────────────────┬──────────────────────────────────────┘
                           ▼
              Layout Engine（純函數，統一文字量測 + 分頁）
                           ▼
                    PagedLayoutIR
        ┌──────────┬───────┴──────┬─────────────┐
        ▼          ▼              ▼             ▼
   React 預覽   視覺 PDF        ATS PDF        DOCX
   （=Canvas    （Chromium 列印  （IR 線性化    （IR → 表格版面
    編輯視圖）    同一 IR 檢視）   成文字流）     + 同源 token）
```

---

## 2. 三大工作流（同一重寫的三個面向）

### A. 版型系統（設計已完成 → template-redesign-31.md）
- 固定核心色盤（米白 / 墨水 / 石墨 / 復古紅 / 螢光黃 / 湖水綠 / 深湖水 / 格線藍）
- 31 款 = 5 版面原型 × 可組合裝飾元件 × 色彩 token（純 JSON）
- 三家族：Notebook 筆記本系 11 款（Marginalia 原版保留）、Bureau 文書系 10 款（HK 銀行/法律/政府）、Studio 極簡系 10 款（科技/設計）
- 舊 ID 映射相容；「純白列印模式」token 切換

### B. 匯出管線
- 預覽/PDF/DOCX/ATS 全部改讀 token + IR
- 視覺 PDF：伺服器 Chromium 列印（向量、可選字、與預覽 100% 一致）；刪除 html2canvas 全鏈（ink 檢測、像素平移、clone 同步、5 層 DOM fallback）
- DOCX：版面原型 → Word 表格映射（sidebar→2 欄表格、timeline→窄日期欄）
- ATS PDF：由 IR 確定性線性化

### C. Canvas Studio
- **CanvasDocument 聚合根**：pages + elements（含 pageId/frame/z/locked/hidden）+ pageSetup（A4/Letter/邊距），單一 store、以履歷文件為 key、可多份、可雲端同步
- **全域 Undo/Redo**：內容 + 版面 + 頁面 + 圖層一體，Ctrl+Z / Ctrl+Shift+Z
- **編輯基本功**：多選/框選/群組、等距分佈、Ctrl+C/V/D、右鍵選單、頁條拖拉排序、真複製頁面
- **溢出警示**：內容超框紅色標記 + 一鍵符合內容高度（數字來自統一量測，保證準確）
- **元素系統**：經歷條目級區塊（可拆出跨頁）、自由文字框、照片（HK 證件照圓形裁切）、分隔線/形狀/icon/QR
- **列印預覽模式**：直接顯示 printPlan 最終分頁（WYSIWYG 由機制保證）
- 進階：具名版面快照（配 Application Package）、AI 排版助手、觸控支援、多頁虛擬化

---

## 3. 統一路線圖（依賴排序）

| # | 階段 | 內容 | 解決 | 依賴 |
|---|---|---|---|---|
| 1 | 版型 token 化 | 31 份 JSON + zod schema；預覽改 CSS variables；`paletteForTemplate` 逐款查表 | Word/ATS PDF 顏色字體立即匹配所選版型 | 無（最快見效） |
| 2 | 統一量測 + Layout IR | 真實文字量測取代啟發式估高；擴展 `layoutDocument/` 為正式 IR | 預覽與匯出分頁/高度一致，跑版消失 | 1 |
| 3 | 版型渲染器重構 | 5 版面原型 shell + 裝飾元件庫，掛上 31 款 token | 31 款成為真正不同的設計 | 1, 2 |
| 4 | 伺服器 PDF | `/api/export/pdf`（Playwright 列印 IR 檢視）；刪 html2canvas 鏈 | 向量 PDF、與預覽像素級一致 | 2, 3 |
| 5 | CanvasDocument + 全域 Undo/Redo | 合併 4 個 store；命令式歷史 | 版面可撤銷、多份履歷、同步完整 | 2（可與 3-4 並行） |
| 6 | DOCX 版面映射 | IR 欄位結構 → Word 表格 | Word 反映實際版面而非單欄 | 2, 3 |
| 7 | Canvas UX 補課 | 多選/複製貼上/溢出警示/智慧輔助線/真複製頁 | 編輯體驗達 Canva 基本線 | 5 |
| 8 | 元素系統擴充 | 條目級區塊、照片、文字框、形狀 | 版面自由度 + 分頁根治 | 5, 7 |
| 9 | 進階 | 具名快照、AI 排版、頁面設定（Letter/邊距）、觸控 | 差異化功能 | 5–8 |

里程碑：**階段 1–2 解決「匯出與版型不匹配」的大部分**；階段 4 解決 PDF 品質；階段 5 解決 Canvas 最大體驗缺口（Undo）。

## 4. 明確不重寫的部分（平移保留）

AI 管線（Gemini + 模擬引擎 + 各 audit）、JobsDB/Apify、申請追蹤器 + 跟進提醒 + WhatsApp、
HK 市場模組（薪酬基準/CV 欄位）、Stripe 計費 + 配額 + Redis、Supabase 認證/同步、
i18n、Express 路由結構、測試基建（Vitest/Playwright/CI）、部署配置。
