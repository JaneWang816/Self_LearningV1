# 學習平台 - 專案檔案結構

> 最後更新：2024/12/27

---

## 📁 專案目錄結構

```
learning-platform/
├── app/
│   ├── layout.tsx                    # 根佈局（PWA 設定）
│   ├── globals.css                   # 全域樣式
│   ├── page.tsx                      # 首頁（登入頁）
│   │
│   └── (dashboard)/
│       └── dashboard/
│           ├── layout.tsx            # Dashboard 佈局（含 Sidebar）
│           ├── page.tsx              # 總覽頁面（日曆 + 模組面板）
│           │
│           ├── plans/
│           │   └── page.tsx          # 每日行程頁面
│           │
│           ├── schedule/
│           │   └── page.tsx          # 課表管理
│           │
│           ├── tasks/
│           │   └── page.tsx          # 任務管理
│           │
│           ├── habits/
│           │   └── page.tsx          # 習慣打卡
│           │
│           ├── journal/
│           │   ├── life/
│           │   │   └── page.tsx      # 生活日誌
│           │   ├── learning/
│           │   │   └── page.tsx      # 學習日誌
│           │   ├── reading/
│           │   │   └── page.tsx      # 閱讀日誌
│           │   ├── gratitude/
│           │   │   └── page.tsx      # 感恩日誌
│           │   └── travel/
│           │       └── page.tsx      # 遊覽日誌（含照片）
│           │
│           ├── subjects/
│           │   └── page.tsx          # 科目管理
│           │
│           ├── practice/
│           │   └── page.tsx          # 題庫練習
│           │
│           ├── mistakes/
│           │   └── page.tsx          # 錯題本
│           │
│           ├── flashcards/
│           │   └── page.tsx          # 記憶卡片
│           │
│           ├── finance/
│           │   └── page.tsx          # 收支記錄
│           │
│           ├── health/
│           │   └── page.tsx          # 健康記錄
│           │
│           ├── export/
│           │   └── page.tsx          # 資料匯出
│           │
│           └── settings/
│               └── page.tsx          # 設定頁面
│
├── components/
│   ├── ui/                           # shadcn/ui 元件
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   │
│   ├── layout/
│   │   ├── sidebar.tsx               # 側邊欄導航
│   │   ├── header.tsx                # 頂部標題列
│   │   └── bottom-nav.tsx            # 手機底部導航
│   │
│   ├── calendar/
│   │   └── calendar-view.tsx         # 日曆元件（含模組顏色指示）
│   │
│   ├── dashboard/
│   │   ├── module-buttons.tsx        # 模組按鈕網格
│   │   ├── photo-uploader.tsx        # 照片上傳元件
│   │   │
│   │   ├── panels/                   # 模組面板
│   │   │   ├── index.ts
│   │   │   ├── constants.ts          # 常量定義
│   │   │   ├── panel-wrapper.tsx     # 面板包裝元件
│   │   │   ├── schedule-panel.tsx
│   │   │   ├── task-panel.tsx
│   │   │   ├── habit-panel.tsx
│   │   │   ├── daily-plan-panel.tsx
│   │   │   ├── journal-life-panel.tsx
│   │   │   ├── journal-learning-panel.tsx
│   │   │   ├── journal-reading-panel.tsx
│   │   │   ├── journal-gratitude-panel.tsx
│   │   │   ├── journal-travel-panel.tsx
│   │   │   ├── finance-panel.tsx
│   │   │   ├── exercise-panel.tsx
│   │   │   └── health-panel.tsx
│   │   │
│   │   └── dialogs/                  # 對話框元件
│   │       ├── index.ts
│   │       ├── task-dialog.tsx
│   │       ├── daily-plan-dialog.tsx
│   │       ├── journal-life-dialog.tsx
│   │       ├── journal-learning-dialog.tsx
│   │       ├── journal-reading-dialog.tsx
│   │       ├── journal-gratitude-dialog.tsx
│   │       ├── journal-travel-dialog.tsx
│   │       ├── finance-dialog.tsx
│   │       ├── exercise-dialog.tsx
│   │       └── health-dialog.tsx
│   │
│   ├── pwa/
│   │   └── register-sw.tsx           # Service Worker 註冊
│   │
│   ├── subjects/
│   │   ├── subject-card.tsx          # 科目卡片
│   │   └── subject-form.tsx          # 科目表單
│   │
│   ├── questions/
│   │   ├── question-form.tsx         # 題目表單
│   │   └── question-import.tsx       # 題目匯入
│   │
│   ├── flashcards/
│   │   └── flashcard-import.tsx      # 卡片匯入
│   │
│   └── exam/
│       └── exam-export.tsx           # 考卷匯出
│
├── lib/
│   ├── supabaseClient.ts             # Supabase 客戶端
│   ├── utils.ts                      # 工具函數（cn）
│   ├── sm2.ts                        # SM-2 記憶演算法
│   ├── speech.ts                     # 語音朗讀功能
│   │
│   └── hooks/
│       └── use-dashboard-data.ts     # Dashboard 資料 Hook
│
├── types/
│   ├── custom.ts                     # 自定義類型
│   └── database_types.ts             # Supabase 資料庫類型
│
├── public/
│   ├── manifest.json                 # PWA 設定檔
│   ├── sw.js                         # Service Worker
│   ├── icon.svg                      # 原始 Logo SVG
│   │
│   └── icons/                        # PWA 圖標
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
│
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## 📊 資料庫結構（Supabase）

### 核心表

| 表名 | 說明 |
|------|------|
| `profiles` | 用戶資料、啟用模組 |
| `subjects` | 科目 |
| `topics` | 主題（屬於科目） |
| `units` | 單元（屬於主題） |
| `questions` | 題目 |
| `question_types` | 題型 |

### 學習系統

| 表名 | 說明 |
|------|------|
| `decks` | 記憶卡片牌組 |
| `flashcards` | 記憶卡片 |
| `mistake_records` | 錯題記錄 |

### 日誌系統

| 表名 | 說明 |
|------|------|
| `journals_life` | 生活日誌 |
| `journals_learning` | 學習日誌 |
| `journals_reading` | 閱讀日誌 |
| `journals_gratitude` | 感恩日誌 |
| `journals_travel` | 遊覽日誌（含照片） |

### 任務與習慣

| 表名 | 說明 |
|------|------|
| `tasks` | 任務 |
| `habits` | 習慣定義 |
| `habit_logs` | 習慣打卡記錄 |
| `daily_plans` | 每日行程（含重複） |
| `schedule_slots` | 課表時段 |

### 健康與收支

| 表名 | 說明 |
|------|------|
| `finance_records` | 收支記錄 |
| `finance_categories` | 收支分類 |
| `health_exercises` | 運動記錄 |
| `health_metrics` | 健康數值（體重、睡眠、飲水、血壓） |

### Storage Bucket

| Bucket | 說明 |
|--------|------|
| `travel-photos` | 遊覽日誌照片 |

---

## 🔧 主要依賴套件

```json
{
  "dependencies": {
    "next": "^14.x",
    "@supabase/supabase-js": "^2.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x",
    "xlsx": "^0.18.x",
    "@radix-ui/react-*": "shadcn/ui 元件",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.x"
  }
}
```

---

## 🚀 功能清單

### ✅ 已完成

- [x] 用戶認證（Supabase Auth）
- [x] 模組化 Dashboard（12 個模組）
- [x] 日曆檢視（月/週）
- [x] 每日行程（含重複功能）
- [x] 課表管理
- [x] 任務管理（重要/緊急）
- [x] 習慣打卡
- [x] 日誌系統 x5
- [x] 遊覽日誌照片上傳
- [x] 學習系統（科目/題庫/錯題本/記憶卡片）
- [x] SM-2 間隔重複演算法
- [x] 收支記錄
- [x] 健康記錄（運動、體重、睡眠、飲水、血壓）
- [x] 資料匯出 Excel
- [x] PWA 支援
- [x] 響應式設計（手機/平板/桌面）

### 📋 未來規劃

- [ ] 統計圖表（學習/習慣/收支/健康）
- [ ] 今日提醒彈窗
- [ ] 深色模式
- [ ] 瀏覽器推送通知
- [ ] 全站搜尋
- [ ] 資料匯入

---

## ⚠️ 注意事項

### Supabase 建表必須加入權限

```sql
-- 每個新表都要加這兩行，否則會 403 Forbidden
GRANT ALL ON [table_name] TO authenticated;
GRANT ALL ON [table_name] TO anon;
```

### Tailwind CSS 版本

使用 `v3.4.1`，避免 v4 相容性問題。

### TypeScript 類型

使用 Supabase CLI 生成類型：

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database_types.ts
```

---

## 📞 技術支援

如有問題，檢查：
1. 瀏覽器 Console（F12）
2. Supabase Dashboard → Logs
3. 確認 RLS 政策和 GRANT 權限
