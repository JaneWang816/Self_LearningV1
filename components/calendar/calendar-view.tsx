// components/calendar/calendar-view.tsx
"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { zhTW } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

// 模組顏色定義
export const MODULE_COLORS = {
  schedule: "bg-blue-500",      // 課表
  tasks: "bg-amber-500",        // 任務
  habits: "bg-cyan-500",        // 習慣打卡
  journal_life: "bg-pink-500",  // 生活日誌
  journal_learning: "bg-purple-500", // 學習日誌
  journal_reading: "bg-green-500",   // 閱讀日誌
  journal_gratitude: "bg-yellow-500", // 感恩日誌
  finance: "bg-emerald-500",    // 收支
  exercise: "bg-orange-500",    // 運動
  health: "bg-red-500",         // 健康
} as const

export type ModuleType = keyof typeof MODULE_COLORS

// 日期資料指示器類型
export interface DayIndicators {
  [dateKey: string]: ModuleType[]
}

interface CalendarViewProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  indicators?: DayIndicators
  view?: "month" | "week"
  onViewChange?: (view: "month" | "week") => void
}

export function CalendarView({
  selectedDate,
  onSelectDate,
  indicators = {},
  view = "month",
  onViewChange,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 上個月
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // 下個月
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // 回到今天
  const handleToday = () => {
    setCurrentMonth(new Date())
    onSelectDate(new Date())
  }

  // 生成月曆日期
  const generateMonthDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // 週一開始
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: Date[] = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  // 生成週檢視日期
  const generateWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const days: Date[] = []

    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }

    return days
  }

  const days = view === "month" ? generateMonthDays() : generateWeekDays()
  const weekDays = ["一", "二", "三", "四", "五", "六", "日"]

  // 取得日期的指示器
  const getIndicators = (date: Date): ModuleType[] => {
    const dateKey = format(date, "yyyy-MM-dd")
    return indicators[dateKey] || []
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, "yyyy年 M月", { locale: zhTW })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs"
          >
            今天
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 月/週切換 */}
          {onViewChange && (
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => onViewChange("month")}
                className={`px-3 py-1.5 text-sm ${
                  view === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                月
              </button>
              <button
                onClick={() => onViewChange("week")}
                className={`px-3 py-1.5 text-sm ${
                  view === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                週
              </button>
            </div>
          )}

          {/* 上下月切換 */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 星期標題 */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className={`grid grid-cols-7 ${view === "week" ? "gap-1" : "gap-0"}`}>
        {days.map((day, index) => {
          const dayIndicators = getIndicators(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const isDayToday = isToday(day)

          return (
            <button
              key={index}
              onClick={() => onSelectDate(day)}
              className={`
                relative p-2 min-h-[70px] md:min-h-[80px] border-t
                flex flex-col items-center
                transition-colors
                ${!isCurrentMonth && view === "month" ? "text-gray-300" : "text-gray-700"}
                ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                ${isDayToday ? "font-bold" : ""}
              `}
            >
              {/* 日期數字 */}
              <span
                className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm
                  ${isSelected ? "bg-blue-600 text-white" : ""}
                  ${isDayToday && !isSelected ? "bg-gray-200" : ""}
                `}
              >
                {format(day, "d")}
              </span>

              {/* 指示器圓點 */}
              {dayIndicators.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1 max-w-full">
                  {dayIndicators.slice(0, 4).map((module, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${MODULE_COLORS[module]}`}
                    />
                  ))}
                  {dayIndicators.length > 4 && (
                    <span className="text-xs text-gray-400">+{dayIndicators.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 圖例 */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.schedule}`} />
            <span>課表</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.tasks}`} />
            <span>任務</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.habits}`} />
            <span>習慣</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.journal_life}`} />
            <span>生活</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.journal_learning}`} />
            <span>學習</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.journal_reading}`} />
            <span>閱讀</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.journal_gratitude}`} />
            <span>感恩</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.finance}`} />
            <span>收支</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.exercise}`} />
            <span>運動</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${MODULE_COLORS.health}`} />
            <span>健康</span>
          </div>
        </div>
      </div>
    </div>
  )
}
