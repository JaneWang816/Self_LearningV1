// components/dashboard/reminder-section.tsx
"use client"

import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckSquare,
  ChevronRight,
  CalendarClock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// 課表時段對照
const SLOT_TIMES: Record<number, string> = {
  1: "08:00",
  2: "09:00",
  3: "10:00",
  4: "11:00",
  5: "12:00",
  6: "13:00",
  7: "14:00",
  8: "15:00",
  9: "16:00",
  10: "17:00",
}

// 類型定義
interface Task {
  id: string
  title: string
  due_date: string | null
  completed_at: string | null
  is_important: boolean
  is_urgent: boolean
}

interface DailyPlan {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  color: string
}

interface ScheduleSlot {
  id: string
  slot_number: number
  subject_name: string
  teacher_name: string | null
  room: string | null
}

interface ReminderSectionProps {
  urgentTasks: Task[]
  todayPlans: DailyPlan[]
  todaySchedule: ScheduleSlot[]
  loading?: boolean
}

// 顏色對照
const planColors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  red: "bg-red-100 text-red-700 border-red-200",
  green: "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
}

export function ReminderSection({
  urgentTasks,
  todayPlans,
  todaySchedule,
  loading = false,
}: ReminderSectionProps) {
  const router = useRouter()

  // 沒有任何提醒時不顯示
  if (!loading && urgentTasks.length === 0 && todayPlans.length === 0 && todaySchedule.length === 0) {
    return null
  }

  // 格式化任務到期日
  const formatDueDate = (dueDate: string | null): { text: string; isOverdue: boolean } => {
    if (!dueDate) return { text: "", isOverdue: false }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: `已過期 ${Math.abs(diffDays)} 天`, isOverdue: true }
    } else if (diffDays === 0) {
      return { text: "今天到期", isOverdue: false }
    } else if (diffDays === 1) {
      return { text: "明天到期", isOverdue: false }
    } else {
      return { text: `${diffDays} 天後到期`, isOverdue: false }
    }
  }

  // 格式化行程時間
  const formatPlanTime = (plan: DailyPlan): string => {
    if (plan.is_all_day) return "全天"
    if (plan.start_time && plan.end_time) {
      return `${plan.start_time.slice(0, 5)} - ${plan.end_time.slice(0, 5)}`
    }
    if (plan.start_time) {
      return plan.start_time.slice(0, 5)
    }
    return ""
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        今日提醒
      </h3>

      <div className="space-y-4">
        {/* 緊急任務 */}
        {urgentTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-red-500" />
                待辦任務
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {urgentTasks.length}
                </span>
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-500"
                onClick={() => router.push("/dashboard/tasks")}
              >
                查看全部
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {urgentTasks.slice(0, 5).map((task) => {
                const { text: dueText, isOverdue } = formatDueDate(task.due_date)
                return (
                  <div
                    key={task.id}
                    className={`
                      flex items-center justify-between p-2 rounded-lg border bg-white
                      ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {task.is_important && (
                        <span className="text-red-500 text-xs">⭐</span>
                      )}
                      <span className={`text-sm truncate ${isOverdue ? "text-red-700" : "text-gray-700"}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className={`text-xs whitespace-nowrap ml-2 ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                      {dueText}
                    </span>
                  </div>
                )
              })}
              {urgentTasks.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  還有 {urgentTasks.length - 5} 項任務...
                </p>
              )}
            </div>
          </div>
        )}

        {/* 今日行程 */}
        {todayPlans.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-indigo-500" />
                今日行程
                <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  {todayPlans.length}
                </span>
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-500"
                onClick={() => router.push("/dashboard/plans")}
              >
                查看全部
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayPlans.slice(0, 6).map((plan) => (
                <div
                  key={plan.id}
                  className={`
                    px-3 py-1.5 rounded-lg border text-sm
                    ${planColors[plan.color] || planColors.blue}
                  `}
                >
                  <span className="font-medium">{plan.title}</span>
                  {formatPlanTime(plan) && (
                    <span className="ml-1.5 opacity-75">
                      ({formatPlanTime(plan)})
                    </span>
                  )}
                </div>
              ))}
              {todayPlans.length > 6 && (
                <div className="px-3 py-1.5 text-sm text-gray-500">
                  +{todayPlans.length - 6} 更多
                </div>
              )}
            </div>
          </div>
        )}

        {/* 今日課表 */}
        {todaySchedule.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                今日課表
                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {todaySchedule.length} 堂
                </span>
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-500"
                onClick={() => router.push("/dashboard/schedule")}
              >
                查看課表
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {todaySchedule.map((slot) => (
                <div
                  key={slot.id}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm"
                >
                  <span className="text-blue-600 font-medium">
                    {SLOT_TIMES[slot.slot_number] || `第${slot.slot_number}節`}
                  </span>
                  <span className="text-blue-800 ml-1.5">{slot.subject_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
