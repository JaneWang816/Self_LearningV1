// components/dashboard/module-buttons.tsx
"use client"

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
  ChevronDown,
  ChevronUp,
  LucideIcon,
} from "lucide-react"
import type { ModuleType } from "@/components/calendar/calendar-view"

export interface ModuleButton {
  key: string
  icon: LucideIcon
  label: string
  color: string
  panelColor: string
}

export const MODULE_BUTTONS: ModuleButton[] = [
  { key: "schedule", icon: Calendar, label: "課表", color: "bg-blue-500", panelColor: "bg-blue-50 border-blue-200" },
  { key: "tasks", icon: CheckSquare, label: "任務", color: "bg-amber-500", panelColor: "bg-amber-50 border-amber-200" },
  { key: "habits", icon: Target, label: "習慣打卡", color: "bg-cyan-500", panelColor: "bg-cyan-50 border-cyan-200" },
  { key: "daily_plan", icon: CalendarClock, label: "每日行程", color: "bg-indigo-500", panelColor: "bg-indigo-50 border-indigo-200" },
  { key: "journal_life", icon: FileText, label: "生活日誌", color: "bg-pink-500", panelColor: "bg-pink-50 border-pink-200" },
  { key: "journal_learning", icon: GraduationCap, label: "學習日誌", color: "bg-purple-500", panelColor: "bg-purple-50 border-purple-200" },
  { key: "journal_reading", icon: BookMarked, label: "閱讀日誌", color: "bg-green-500", panelColor: "bg-green-50 border-green-200" },
  { key: "journal_gratitude", icon: Heart, label: "感恩日誌", color: "bg-yellow-500", panelColor: "bg-yellow-50 border-yellow-200" },
  { key: "journal_travel", icon: Compass, label: "遊覽日誌", color: "bg-sky-500", panelColor: "bg-sky-50 border-sky-200" },
  { key: "finance", icon: Wallet, label: "收支", color: "bg-emerald-500", panelColor: "bg-emerald-50 border-emerald-200" },
  { key: "exercise", icon: Dumbbell, label: "運動", color: "bg-orange-500", panelColor: "bg-orange-50 border-orange-200" },
  { key: "health", icon: Activity, label: "健康", color: "bg-red-500", panelColor: "bg-red-50 border-red-200" },
]

interface ModuleButtonGridProps {
  expandedModule: string | null
  selectedIndicators: ModuleType[]
  onModuleClick: (key: string) => void
}

export function ModuleButtonGrid({
  expandedModule,
  selectedIndicators,
  onModuleClick,
}: ModuleButtonGridProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {MODULE_BUTTONS.map((module) => {
        const Icon = module.icon
        const hasData = selectedIndicators.includes(module.key as ModuleType)
        const isExpanded = expandedModule === module.key

        return (
          <button
            key={module.key}
            onClick={() => onModuleClick(module.key)}
            className={`
              relative flex flex-col items-center justify-center p-4 rounded-lg
              border-2 transition-all
              ${isExpanded
                ? "border-blue-500 bg-blue-50 shadow-md"
                : hasData 
                  ? "border-gray-300 bg-gray-50" 
                  : "border-dashed border-gray-200 bg-white"
              }
              hover:shadow-md hover:border-gray-400
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${module.color} bg-opacity-20`}>
              <Icon className={`w-5 h-5 ${module.color.replace("bg-", "text-")}`} />
            </div>
            <span className="text-sm text-gray-700 mt-2">{module.label}</span>
            
            {hasData && (
              <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${module.color}`} />
            )}

            <span className="absolute bottom-1 right-1">
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-blue-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// 取得模組設定
export function getModuleConfig(key: string): ModuleButton | undefined {
  return MODULE_BUTTONS.find(m => m.key === key)
}
