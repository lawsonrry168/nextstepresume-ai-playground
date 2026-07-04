# 31 款 CV 版型重新設計 — 「Retro Stationery 復古文具」設計系統

> 設計目標：以 modern-01「Lined Paper / Legal Pad」的設計語言與配色為整個目錄的 DNA，
> 把「31 個名字、4 個版面」重造為「31 個真正不同、且全部適合 CV 的設計」。
> 版型定義為純資料 token（JSON），預覽 / PDF / DOCX 三端共用，根治匯出不匹配。

---

## 1. 現有 31 款的研究結論

| 事實 | 證據 |
|---|---|
| 只有 4 個真實版面 | `ResumeTemplateRenderer.tsx`：marginalia（僅 modern-01）、`ResumeA4FlowDocument`（modern 02–11 + classic 01–10 共用）、`ResumeA4MinimalistDocument`（minimalist 01–10）、embedded 縮略版 |
| 家族內差異只是換色 | `resumeTemplateCatalog.ts`：MODERN_PRESETS 只換 accent 漸層色；CLASSIC_PRESETS 只換邊框與字距 class；MINIMAL_PRESETS 只換色點 |
| 顏色無系統 | emerald / violet / rose / amber / zinc 等 Tailwind 隨機取色，與招牌復古文具風格互相打架 |
| 匯出端只有 3 套調色盤 | `paletteForTemplate()` 把 31 款折疊成 3 套 → Word / ATS PDF 永遠對不上所選版型 |
| 顏色鎖死在 class 字串 | `"text-[#c0392b]"` 這類字串 DOCX / jsPDF 無法讀取 |

**modern-01 的簽名元素**（`src/index.css` `.marginalia-theme`）：
28px 橫線紙背景（`notebook-bg`）、左側紅色頁邊線（`notebook-margin`）、
螢光筆掃字（`highlight-marker`）、薄荷/螢光黃貼紙藥丸（`sticker-pill`）、
米白紙面卡片 + 紅色左邊框（`notebook-card`）、石墨色大寫小標（`ui-label`）。

---

## 2. 色彩系統（固定核心盤，全 31 款共用）

沿用並系統化現有 CSS tokens，**不新增色相，只補「文字安全深階」**：

| Token | Hex | 角色 | 使用規則 |
|---|---|---|---|
| `paper` | `#FAF6EB` | 米白紙面底色 | 全款底色；匯出可切換「純白列印模式」`#FFFFFF` |
| `paper-tint` | `#FBF3DC` | 黃箋紙變體 | 僅 Legal Pad 系底色 |
| `ink` | `#1A2438` | 深藍灰墨水 | 正文、主標題（對比 13.4:1，AAA） |
| `graphite` | `#535C68` | 石墨灰 | 次要標題、日期、標籤 |
| `red` | `#C0392B` | 復古深紅 | 姓名、重點標題、機構名、頁邊線；每款用量 ≤ 10% |
| `red-deep` | `#A93226` | 深紅（hover/印刷校正） | 互動態與細字紅 |
| `marker` | `#F5D76E` | 螢光黃 | **只做底色/掃字，永不做字色**（對比不足） |
| `mint` | `#D4EDDA` | 湖水綠（淺） | chip 底、區塊底 |
| `teal` | `#2E7D74` | 湖水綠（深階，新增） | mint 的文字安全深版：標題、圖示（對比 5.6:1） |
| `rule` | `#C5D9E8` | 淺藍格線 | 橫線紙、分隔細線 |
| `rule-deep` | `#5B8FB9` | 藍格線深階 | Blueprint 系主 accent |
| `eraser` | `#F2C1C1` | 橡皮擦粉 | 極少量 chip 用（僅 studio-08） |

**CV 適用性守則（每款必須遵守）**
1. 正文一律 `ink`，非彩色 accent（可讀性優先）。
2. 每款只有**一個主 accent**（紅、深湖水綠或深藍其一），其餘色只做點綴底色。
3. 螢光黃/薄荷/粉只做背景層，字色永遠 ink/graphite/red/teal。
4. 所有版面結構可線性化（單欄閱讀順序明確）→ ATS PDF 可從同一 IR 導出。
5. 提供「純白列印模式」token 切換（paper→white），設計不變。

## 3. 字體系統

| 用途 | 西文 | 繁中（zh-HK） | DOCX 對應 |
|---|---|---|---|
| Display（姓名） | Playfair Display / Georgia | Noto Serif TC | Georgia / 新細明體 |
| Serif 正文 | Source Serif 4 / Georgia | Noto Serif TC | Georgia |
| Sans 正文/標籤 | Public Sans / Inter | Noto Sans TC | Calibri / 微軟正黑體 |
| Mono（Console/Archive） | IBM Plex Mono | Noto Sans Mono TC | Consolas |

PDF（伺服器 Chromium 列印）內嵌 Noto 字型；DOCX 走右欄 fallback。

## 4. 版面原型（Layout Archetypes，供版面引擎 + DOCX 映射）

| 原型 | 說明 | DOCX 映射 |
|---|---|---|
| `single` | 單欄流式 | 段落流 |
| `sidebar-left` / `sidebar-right` | 224px 側欄 + 主欄 | 2 欄無框表格 |
| `two-column` | 等寬雙欄（引擎自動平衡） | 2 欄等寬表格 |
| `timeline` | 左側日期/線軸 + 右側內容 | 2 欄表格（窄日期欄） |
| `header-band` | 全寬頭部帶 + 下方任一原型 | 首行合併儲存格 |

---

## 5. 家族 A — Notebook 筆記本系（11 款）

> Lined Paper / Legal Pad 直系。裝飾感最強、仍守 CV 分寸。
> 適合：創意、市場、教育、初階求職者。
> 家族共通：serif 正文、`ruled lines` 或紙質元素至少一項、留白 regular。
> 舊 ID 對應：`modern-01..11 → notebook-01..11`（`normalizeTemplateStyle` 保持相容）。

| ID | 名稱 | 原型 | 設計規格 | 適合 |
|---|---|---|---|---|
| notebook-01 | Marginalia 頁邊筆記 | sidebar-left | **原版完整保留**：紅頁邊線 + 28px 橫線紙 + 螢光掃字 + mint/黃貼紙 + 紙面卡片 | 全能旗艦款 |
| notebook-02 | Legal Pad 律師黃箋 | single | 底色 `paper-tint` 黃箋；左側**雙紅線**頁邊；ink 姓名、graphite 小型大寫標題；日期右對齊紅字；無貼紙 | 法律/顧問 |
| notebook-03 | Graph Paper 方格紙 | single | 4mm 淡方格底（`rule` 24% 透明度）；`teal` 標題側標籤；紅只用於姓名與連結 | 工程/建築/數據 |
| notebook-04 | Index Card 索引卡 | single | 頭部做成卡片（紙面白升階 + 3px 紅頂線 + 陰影）；各節 hairline 卡片；正文無橫線 | 產品/項目管理 |
| notebook-05 | Composition 作文簿 | single | 置中頭部；姓名 serif + **雙紅底線**；橫線只出現在節標題下；正文兩端對齊 | 教育/行政 |
| notebook-06 | Sticky Note 便利貼 | sidebar-right | 技能/語言為 mint 與 marker 便利貼 chip（預覽微傾 0.5°、匯出取正）；主欄乾淨 | 市場/社群 |
| notebook-07 | Highlighter 螢光筆 | single | 無橫線純米白；成就關鍵詞 `highlight-marker` 掃黃；紅姓名、graphite 標題 | Notebook 系最 ATS 穩 |
| notebook-08 | Red Thread 紅線裝訂 | timeline | 左側紅色縫線軸 + 每段經歷紅點；頁頂虛線紅縫邊 | 敘事型職涯 |
| notebook-09 | Blueprint 藍圖備忘 | single | 主 accent 換 `rule-deep` 藍（標題/分線）；紅只留姓名；極淡橫線 | 技術管理/文檔 |
| notebook-10 | Teal Ledger 湖水帳簿 | single | `teal` 標題 + 經歷列隔行 mint 底紋（帳簿感）；日期紅字 | 財務/會計 |
| notebook-11 | Draft Stamp 草稿印章 | single | 全 graphite/ink 為主；聯絡方式做成紅描邊「印章」圓角框；marker 只掃節標題 | 攝影/創意（克制版） |

## 6. 家族 B — Bureau 文書系（10 款）

> Serif、保守、最高 ATS 安全度。米白紙保留，裝飾降到細線與字藝。
> 適合：香港銀行、法律、政府、傳統企業。
> 舊 ID 對應：`classic-01..10 → bureau-01..10`。

| ID | 名稱 | 原型 | 設計規格 | 適合 |
|---|---|---|---|---|
| bureau-01 | Bureau Classic 經典文書 | single | 置中 serif 頭部；小型大寫標題 + `rule` 細線；紅只用於姓名 | 萬用保守款 |
| bureau-02 | Barrister 大律師 | timeline | 日期靠左窄欄（英式編年體）；全 ink，機構名紅字 | 法律/合規 |
| bureau-03 | Registrar 註冊處 | single | 大寫寬字距標題；紅色方形 bullet；正文兩端對齊、寬邊距 | 政府/公營 |
| bureau-04 | Broadsheet 大報 | single | 特大 serif 姓名 + 細雙線；摘要排成雙文字欄 + 欄間細線；正文單欄 | 傳媒/編輯 |
| bureau-05 | Minute Book 會議紀錄 | single | 節序號 01/02/03 紅色 serif；懸掛縮排正文 | 公司秘書/治理 |
| bureau-06 | Treasury 庫房 | single | `teal` 標題；頭部左上紅描邊姓名首字母方磚（monogram） | 銀行/金融 |
| bureau-07 | Chancery 衡平 | single | 職稱/日期用 serif italic；聯絡列 mint 底帶；hairline 分線 | 基金/資管 |
| bureau-08 | Docket 案卷 | single-compact | 日期右對齊 + 紅點引導線（dotted leaders）；緊湊密度 | 資深多經歷者 |
| bureau-09 | Archive 檔案室 | header-band | HK 欄位（簽證/通知期/期望薪金）以 mono 標籤裝入米白資訊盒；頁頂紅細線 | 香港本地投遞 |
| bureau-10 | Signet 印鑑 | single | 全置中；節與節之間紅色 ❖ 印記分隔符；寬字距姓名 | 學術/顧問 |

## 7. 家族 C — Studio 極簡系（10 款）

> Sans、留白驅動、現代。適合科技、設計、初創。
> 舊 ID 對應：`minimalist-01..10 → studio-01..10`。

| ID | 名稱 | 原型 | 設計規格 | 適合 |
|---|---|---|---|---|
| studio-01 | Studio Grid 工作室格 | sidebar-left | graphite 大寫標籤 + mint 圓點；現 minimalist 骨架升級校色 | 通用科技 |
| studio-02 | Whiteboard 白板 | single | 每節 2px `teal` 左邊線；全平面無陰影 | 工程師 |
| studio-03 | Marker One 一筆螢光 | single | 姓名 marker 掃黃一筆；其餘全 ink/graphite —「一個亮點」哲學 | 設計/品牌 |
| studio-04 | Mint Tab 薄荷標籤 | sidebar-right | 節標題為 mint 底圓角 chip（字 `teal`）；主欄純文字 | 產品/UX |
| studio-05 | Redline 紅線 | single | 節間 0.5pt 紅 hairline；大邊距大留白 | 建築/顧問 |
| studio-06 | Graphite 石墨 | single | 全 graphite/ink 無彩；紅只出現在超連結 | 最保守 tech CV |
| studio-07 | Two-Track 雙軌 | two-column | 引擎平衡等寬雙欄；graphite 大寫標題；頁角紅色摺角記號 | 內容多的中生代 |
| studio-08 | Eraser 橡皮擦 | sidebar-left | 技能 mint chip、語言 `eraser` 粉 chip（全圓角）；輕鬆但克制 | 畢業生/初階 |
| studio-09 | Console 終端 | single | mono 標題 + `teal` ▍游標塊前綴；正文 sans | 開發者 |
| studio-10 | Gallery 畫廊 | single | 極限留白；9px 大寫小標；紅色單點 bullet；姓名小而寬字距 | 資深設計師 |

---

## 8. Token Schema（版型 = 資料）

```ts
interface TemplateDefinition {
  id: string;                                // "notebook-02"
  family: "notebook" | "bureau" | "studio";
  legacyId?: string;                         // "modern-02" — 舊資料相容
  name: { en: string; "zh-HK": string };
  layout: "single" | "sidebar-left" | "sidebar-right" | "two-column" | "timeline" | "header-band";
  density: "airy" | "regular" | "compact";
  colors: {                                  // 一律 hex，三端共用
    paper: string; ink: string; muted: string;
    accent: string;                          // 主 accent（唯一）
    accentSoft?: string;                     // chip/底紋
    highlight?: string;                      // marker 掃字底
    rule: string;                            // 分線
    datesColor?: string;
  };
  typography: {
    display: string; body: string; label: string; mono?: string;
    nameSize: number; bodySize: number; lineHeight: number;
    titleCase: "upper" | "smallcaps" | "none";
  };
  decorations: {
    ruledLines?: { gap: number; color: string; opacity: number };
    marginLine?: { color: string; double?: boolean };
    gridPaper?: { size: number; opacity: number };
    highlightMarker?: boolean;
    stickers?: boolean;
    numberedSections?: boolean;
    timelineThread?: boolean;
    dividerGlyph?: string;                   // "❖"
    monogram?: boolean;
    dottedLeaders?: boolean;
  };
}
```

**渲染規則**：預覽端由 token 生成 CSS variables；DOCX 端 `paletteForTemplate(id)` 改為直接讀該款 `colors`；PDF 端（IR 向量/Chromium）同源。`decorations` 中無法在 DOCX 呈現的（橫線紙、掃字）自動降級為省略，但顏色/字體/結構 100% 跟隨。

### 範例 1 — notebook-01（原版保留）
```json
{
  "id": "notebook-01", "family": "notebook", "legacyId": "modern-01",
  "name": { "en": "Marginalia", "zh-HK": "頁邊筆記" },
  "layout": "sidebar-left", "density": "regular",
  "colors": { "paper": "#FAF6EB", "ink": "#1A2438", "muted": "#535C68",
    "accent": "#C0392B", "accentSoft": "#D4EDDA", "highlight": "#F5D76E",
    "rule": "#C5D9E8", "datesColor": "#535C68" },
  "typography": { "display": "Playfair Display", "body": "Source Serif 4",
    "label": "Public Sans", "nameSize": 34, "bodySize": 10.5,
    "lineHeight": 1.5, "titleCase": "upper" },
  "decorations": { "ruledLines": { "gap": 28, "color": "#C5D9E8", "opacity": 1 },
    "marginLine": { "color": "#C0392B" }, "highlightMarker": true, "stickers": true }
}
```

### 範例 2 — bureau-06 Treasury
```json
{
  "id": "bureau-06", "family": "bureau", "legacyId": "classic-06",
  "name": { "en": "Treasury", "zh-HK": "庫房" },
  "layout": "single", "density": "regular",
  "colors": { "paper": "#FAF6EB", "ink": "#1A2438", "muted": "#535C68",
    "accent": "#2E7D74", "accentSoft": "#D4EDDA", "rule": "#C5D9E8",
    "datesColor": "#535C68" },
  "typography": { "display": "Playfair Display", "body": "Source Serif 4",
    "label": "Public Sans", "nameSize": 30, "bodySize": 10.5,
    "lineHeight": 1.55, "titleCase": "smallcaps" },
  "decorations": { "monogram": true }
}
```

### 範例 3 — studio-03 Marker One
```json
{
  "id": "studio-03", "family": "studio", "legacyId": "minimalist-03",
  "name": { "en": "Marker One", "zh-HK": "一筆螢光" },
  "layout": "single", "density": "airy",
  "colors": { "paper": "#FAF6EB", "ink": "#1A2438", "muted": "#535C68",
    "accent": "#1A2438", "highlight": "#F5D76E", "rule": "#C5D9E8" },
  "typography": { "display": "Public Sans", "body": "Public Sans",
    "label": "Public Sans", "nameSize": 32, "bodySize": 10,
    "lineHeight": 1.6, "titleCase": "upper" },
  "decorations": { "highlightMarker": true }
}
```

---

## 9. 落地順序（銜接重寫方案 Phase 1）

1. 建 `src/lib/templates/definitions/*.json`（31 份 token）+ zod schema 驗證。
2. 預覽端：`ResolvedResumeTheme` 改由 token 生成 CSS variables（`.marginalia-theme` 模式推廣到全部家族）。
3. 每個 `decorations` 旗標對應一個可組合的裝飾元件（RuledPaper、MarginLine、Monogram、TimelineThread…），版面原型對應 5 個 layout shell — **31 款 = 5 原型 × 裝飾組合 × token**，不再是 31 份重複 JSX。
4. `paletteForTemplate` / ATS PDF 調色改為逐款讀 token → Word/PDF 立即與所選版型一致。
5. TemplatePicker 依三家族分組 + 真實縮圖（由同一渲染器縮放生成，不再手繪縮圖）。
6. 舊 ID 映射進 `normalizeTemplateStyle`，既有用戶資料無痛遷移。
