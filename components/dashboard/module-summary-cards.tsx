// components/dashboard/module-summary-cards.tsx
"use client"

import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckSquare,
  FileText,
  GraduationCap,
  BookMarked,
  Heart,
  Wallet,
  Dumbbell,
  Activity,
  Target,
  CalendarClock,
  Compass,
  Check,
  LucideIcon,
} from "lucide-react"
import type { ModuleType } from "@/components/calendar/calendar-view"

export interface ModuleSummary {
  key: string
  icon: LucideIcon
  label: string
  color: string
  bgColor: string
  borderColor: string
  href: string
}

export const MODULE_CONFIGS: ModuleSummary[] = [
  { 
    key: "schedule", 
    icon: Calendar, 
    label: "課表", 
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    href: "/dashboard/schedule"
  },
  { 
    key: "tasks", 
    icon: CheckSquare, 
    label: "任務", 
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    href: "/dashboard/tasks"
  },
  { 
    key: "habits", 
    icon: Target, 
    label: "習慣", 
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    href: "/dashboard/habits"
  },
  { 
    key: "daily_plan", 
    icon: CalendarClock, 
    label: "行程", 
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    href: "/dashboard/plans"
  },
  { 
    key: "journal_life", 
    icon: FileText, 
    label: "生活", 
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    href: "/dashboard/journal/life"
  },
  { 
    key: "journal_learning", 
    icon: GraduationCap, 
    label: "學習", 
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    href: "/dashboard/journal/learning"
  },
  { 
    key: "journal_reading", 
    icon: BookMarked, 
    label: "閱讀", 
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    href: "/dashboard/journal/reading"
  },
  { 
    key: "journal_gratitude", 
    icon: Heart, 
    label: "感恩", 
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    href: "/dashboard/journal/gratitude"
  },
  { 
    key: "journal_travel", 
    icon: Compass, 
    label: "遊覽", 
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    href: "/dashboard/journal/travel"
  },
  { 
    key: "finance", 
    icon: Wallet, 
    label: "收支", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    href: "/dashboard/finance"
  },
  { 
    key: "exercise", 
    icon: Dumbbell, 
    label: "運動", 
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    href: "/dashboard/health"
  },
  { 
    key: "health", 
    icon: Activity, 
    label: "健康", 
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    href: "/dashboard/health"
  },
]

// 摘要資料類型
export interface DaySummaryData {
  schedule: { count: number }
  tasks: { total: number; completed: number }
  habits: { total: number; completed: number }
  daily_plan: { count: number }
  journal_life: { hasEntry: boolean }
  journal_learning: { hasEntry: boolean }
  journal_reading: { hasEntry: boolean }
  journal_gratitude: { hasEntry: boolean }
  journal_travel: { count: number }
  finance: { income: number; expense: number }
  exercise: { count: number }
  health: { count: number }
}

interface ModuleSummaryCardsProps {
  selectedDate: string // yyyy-MM-dd
  indicators: ModuleType[]
  summaryData: DaySummaryData
}

export function ModuleSummaryCards({
  selectedDate,
  indicators,
  summaryData,
}: ModuleSummaryCardsProps) {
  const router = useRouter()

  const handleClick = (module: ModuleSummary) => {
    // 跳轉到對應頁面，帶上日期參數
    router.push(`${module.href}?date=${selectedDate}`)
  }

  // 取得摘要文字
  const getSummaryText = (key: string): string => {
    const hasData = indicators.includes(key as ModuleType)
    
    switch (key) {
      case "schedule":
        return summaryData.schedule.count > 0 
          ? `${summaryData.schedule.count} 堂課` 
          : "無課程"
      case "tasks":
        if (summaryData.tasks.total === 0) return "無任務"
        return `${summaryData.tasks.completed}/${summaryData.tasks.total} 完成`
      case "habits":
        if (summaryData.habits.total === 0) return "無習慣"
        return `${summaryData.habits.completed}/${summaryData.habits.total} 打卡`
      case "daily_plan":
        return summaryData.daily_plan.count > 0 
          ? `${summaryData.daily_plan.count} 項行程` 
          : "無行程"
      case "journal_life":
        return summaryData.journal_life.hasEntry ? "已記錄" : "未記錄"
      case "journal_learning":
        return summaryData.journal_learning.hasEntry ? "已記錄" : "未記錄"
      case "journal_reading":
        return summaryData.journal_reading.hasEntry ? "已記錄" : "未記錄"
      case "journal_gratitude":
        return summaryData.journal_gratitude.hasEntry ? "已記錄" : "未記錄"
      case "journal_travel":
        return summaryData.journal_travel.count > 0 
          ? `${summaryData.journal_travel.count} 篇` 
          : "未記錄"
      case "finance":
        const { income, expense } = summaryData.finance
        if (income === 0 && expense === 0) return "無記錄"
        if (income > 0 && expense > 0) return `+${income} / -${expense}`
        if (income > 0) return `+${income}`
        return `-${expense}`
      case "exercise":
        return summaryData.exercise.count > 0 
          ? `${summaryData.exercise.count} 項運動` 
          : "未運動"
      case "health":
        return summaryData.health.count > 0 
          ? `${summaryData.health.count} 項記錄` 
          : "無記錄"
      default:
        return hasData ? "有資料" : "無資料"
    }
  }

  // 判斷是否完成（用於顯示打勾）
  const isCompleted = (key: string): boolean => {
    switch (key) {
      case "tasks":
        return summaryData.tasks.total > 0 && 
               summaryData.tasks.completed === summaryData.tasks.total
      case "habits":
        return summaryData.habits.total > 0 && 
               summaryData.habits.completed === summaryData.habits.total
      case "journal_life":
        return summaryData.journal_life.hasEntry
      case "journal_learning":
        return summaryData.journal_learning.hasEntry
      case "journal_reading":
        return summaryData.journal_reading.hasEntry
      case "journal_gratitude":
        return summaryData.journal_gratitude.hasEntry
      default:
        return false
    }
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
      {MODULE_CONFIGS.map((module) => {
        const Icon = module.icon
        const hasData = indicators.includes(module.key as ModuleType)
        const completed = isCompleted(module.key)
        const summaryText = getSummaryText(module.key)

        return (
          <button
            key={module.key}
            onClick={() => handleClick(module)}
            className={`
              relative flex flex-col items-center justify-center 
              p-3 sm:p-4 rounded-xl border-2 transition-all
              ${hasData 
                ? `${module.bgColor} ${module.borderColor}` 
                : "bg-gray-50 border-gray-200 border-dashed"
              }
              hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            {/* 完成標記 */}
            {completed && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* 有資料標記（非完成狀態） */}
            {hasData && !completed && (
              <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${module.color.replace("text-", "bg-")}`} />
            )}

            {/* 圖示 */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasData ? module.bgColor : "bg-gray-100"}`}>
              <Icon className={`w-5 h-5 ${hasData ? module.color : "text-gray-400"}`} />
            </div>

            {/* 標籤 */}
            <span className={`text-sm font-medium mt-1.5 ${hasData ? "text-gray-800" : "text-gray-500"}`}>
              {module.label}
            </span>

            {/* 摘要 */}
            <span className={`text-xs mt-0.5 ${hasData ? module.color : "text-gray-400"}`}>
              {summaryText}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// 取得模組設定
export function getModuleConfig(key: string): ModuleSummary | undefined {
  return MODULE_CONFIGS.find(m => m.key === key)
}
