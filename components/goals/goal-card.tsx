// components/goals/goal-card.tsx
"use client"

import { differenceInDays, parseISO, format, startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, isBefore } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Target, TrendingUp, TrendingDown, Flame, Calendar, Pencil, Trash2, CheckCircle, Pause, Play, Clock, Repeat, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Json 類型（與 Supabase 兼容）
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// 目標類型
export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  icon: string
  color: string
  goal_type: "countdown" | "numeric" | "streak" | "count"
  start_value: number | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  direction: "increase" | "decrease"
  target_count: number | null
  current_count: number | null
  target_date: string | null
  period_type: "once" | "monthly" | "yearly"
  period_target: number | null
  track_source: string
  track_config: Json | null
  started_at: string
  deadline: string | null
  status: "active" | "completed" | "paused" | "archived"
  completed_at: string | null
  show_on_dashboard: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface GoalCardProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (id: string) => void
  onUpdateStatus?: (id: string, status: Goal["status"]) => void
  onUpdateProgress?: (goal: Goal) => void
  onViewStats?: (goal: Goal) => void
  compact?: boolean
}

// 顏色配置
const colorConfig: Record<string, { bg: string; border: string; text: string; progress: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", progress: "bg-blue-500" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", progress: "bg-red-500" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", progress: "bg-green-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", progress: "bg-amber-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", progress: "bg-purple-500" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-600", progress: "bg-pink-500" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600", progress: "bg-indigo-500" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600", progress: "bg-cyan-500" },
}

export function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  onUpdateProgress,
  onViewStats,
  compact = false 
}: GoalCardProps) {
  const colors = colorConfig[goal.color] || colorConfig.blue

  // 計算進度百分比
  const getProgress = (): number => {
    switch (goal.goal_type) {
      case "countdown":
        return 0 // 倒數不顯示進度條
      case "numeric":
        if (!goal.start_value || !goal.target_value || goal.current_value === null) return 0
        if (goal.direction === "decrease") {
          // 減少型：從 start 減到 target
          const total = goal.start_value - goal.target_value
          const current = goal.start_value - goal.current_value
          return Math.min(100, Math.max(0, (current / total) * 100))
        } else {
          // 增加型：從 start 加到 target
          const total = goal.target_value - goal.start_value
          const current = goal.current_value - goal.start_value
          return Math.min(100, Math.max(0, (current / total) * 100))
        }
      case "streak":
      case "count":
        if (!goal.target_count) return 0
        return Math.min(100, ((goal.current_count || 0) / goal.target_count) * 100)
      default:
        return 0
    }
  }

  // 格式化數值（避免浮點數精度問題）
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "0"
    // 如果是整數，直接顯示
    if (Number.isInteger(num)) return num.toString()
    // 否則最多顯示 2 位小數，並移除尾部的 0
    return parseFloat(num.toFixed(2)).toString()
  }

  // 取得顯示文字
  const getStatusText = (): string => {
    // 週期性目標顯示當期進度
    if (goal.period_type !== "once" && goal.period_target) {
      const periodLabel = goal.period_type === "monthly" ? "本月" : "今年"
      if (goal.goal_type === "numeric") {
        return `${periodLabel} ${formatNumber(goal.current_value)} / ${formatNumber(goal.period_target)} ${goal.unit || ""}`
      } else if (goal.goal_type === "count") {
        return `${periodLabel} ${goal.current_count || 0} / ${formatNumber(goal.period_target)} ${goal.unit || "次"}`
      }
    }

    switch (goal.goal_type) {
      case "countdown":
        if (!goal.target_date) return "未設定日期"
        const days = differenceInDays(parseISO(goal.target_date), new Date())
        if (days < 0) return "已過期"
        if (days === 0) return "就是今天！"
        return `還有 ${days} 天`
      
      case "numeric":
        if (goal.current_value === null || goal.target_value === null) return "未設定"
        const diff = goal.direction === "decrease" 
          ? goal.current_value - goal.target_value
          : goal.target_value - goal.current_value
        if (diff <= 0) return "已達成！"
        return `還差 ${formatNumber(Math.abs(diff))} ${goal.unit || ""}`
      
      case "streak":
        return `${goal.current_count || 0}/${goal.target_count} 天`
      
      case "count":
        return `${goal.current_count || 0}/${goal.target_count} ${goal.unit || "次"}`
      
      default:
        return ""
    }
  }

  // 取得追蹤來源名稱
  const getTrackSourceLabel = (): string => {
    const labels: Record<string, string> = {
      manual: "手動更新",
      habit: "習慣打卡",
      weight: "體重記錄",
      finance_savings: "累計儲蓄",
      finance_income: "累計收入",
      finance_expense: "控制支出",
      exercise_count: "運動次數",
      exercise_minutes: "運動時間",
      reading_books: "讀完書籍",
      water_days: "飲水達標",
      sleep_days: "睡眠達標",
    }
    return labels[goal.track_source] || "手動更新"
  }

  // 取得週期標籤
  const getPeriodLabel = (): string | null => {
    if (goal.period_type === "once") return null
    return goal.period_type === "monthly" ? "🔄 每月" : "🔄 每年"
  }

  // 取得截止日期文字
  const getDeadlineText = (): string | null => {
    if (!goal.deadline) return null
    const deadlineDate = parseISO(goal.deadline)
    const daysLeft = differenceInDays(deadlineDate, new Date())
    if (daysLeft < 0) return "已過期"
    if (daysLeft === 0) return "今天截止"
    if (daysLeft <= 7) return `${daysLeft} 天後截止`
    return `截止 ${format(deadlineDate, "M/d")}`
  }

  // 取得子標題
  const getSubtitle = (): string => {
    const parts: string[] = []
    
    // 追蹤來源
    if (goal.track_source !== "manual") {
      parts.push(`📊 ${getTrackSourceLabel()}`)
    }
    
    // 週期
    const periodLabel = getPeriodLabel()
    if (periodLabel) {
      parts.push(periodLabel)
    }
    
    // 截止日期
    const deadlineText = getDeadlineText()
    if (deadlineText && goal.goal_type !== "countdown") {
      parts.push(`⏰ ${deadlineText}`)
    }
    
    // 數值進度（非週期）
    if (goal.goal_type === "numeric" && goal.period_type === "once") {
      if (goal.current_value !== null && goal.target_value !== null) {
        parts.unshift(`${formatNumber(goal.current_value)} → ${formatNumber(goal.target_value)} ${goal.unit || ""}`)
      }
    }
    
    // 倒數日期
    if (goal.goal_type === "countdown" && goal.target_date) {
      return format(parseISO(goal.target_date), "M月d日 EEEE", { locale: zhTW })
    }
    
    return parts.join(" • ") || "手動記錄"
  }

  // 取得圖示
  const getIcon = () => {
    switch (goal.goal_type) {
      case "countdown":
        return <Calendar className="w-5 h-5" />
      case "numeric":
        return goal.direction === "decrease" 
          ? <TrendingDown className="w-5 h-5" />
          : <TrendingUp className="w-5 h-5" />
      case "streak":
        return <Flame className="w-5 h-5" />
      case "count":
        return <Target className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const progress = getProgress()
  const isCompleted = goal.status === "completed"
  const isPaused = goal.status === "paused"

  // 精簡版卡片（用於 Dashboard）
  if (compact) {
    return (
      <div 
        className={`
          relative p-4 rounded-xl border-2 transition-all cursor-pointer
          ${colors.bg} ${colors.border}
          ${isPaused ? "opacity-60" : ""}
          hover:shadow-md
        `}
        onClick={() => onUpdateProgress?.(goal)}
      >
        {/* 完成標記 */}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}

        {/* 圖示與標題 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{goal.icon}</span>
          <span className="font-medium text-gray-800 truncate">{goal.title}</span>
        </div>

        {/* 狀態文字 */}
        <div className={`text-lg font-bold ${colors.text}`}>
          {getStatusText()}
        </div>

        {/* 進度條（非倒數型） */}
        {goal.goal_type !== "countdown" && (
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${colors.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* 子標題 */}
        <div className="text-xs text-gray-500 mt-1">
          {getSubtitle()}
        </div>
      </div>
    )
  }

  // 完整版卡片（用於目標管理頁面）
  return (
    <div 
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${colors.bg} ${colors.border}
        ${isPaused ? "opacity-60" : ""}
      `}
    >
      {/* 標題列 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg} border ${colors.border}`}>
            <span className="text-2xl">{goal.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-gray-500">{goal.description}</p>
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-1">
          {/* 統計按鈕（僅自動追蹤目標顯示） */}
          {goal.track_source !== "manual" && onViewStats && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-blue-600"
              onClick={() => onViewStats(goal)}
              title="查看統計"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onEdit?.(goal)}
            title="編輯"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {goal.status === "active" && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onUpdateStatus?.(goal.id, "paused")}
              title="暫停"
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}
          {goal.status === "paused" && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onUpdateStatus?.(goal.id, "active")}
              title="繼續"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          {goal.status === "active" && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-green-600"
              onClick={() => onUpdateStatus?.(goal.id, "completed")}
              title="標記完成"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500"
            onClick={() => onDelete?.(goal.id)}
            title="刪除"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 進度區 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-2xl font-bold ${colors.text}`}>
            {getStatusText()}
          </span>
          {goal.goal_type !== "countdown" && (
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          )}
        </div>

        {/* 進度條 */}
        {goal.goal_type !== "countdown" && (
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${colors.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* 子標題 */}
        <div className="text-sm text-gray-500 mt-1">
          {getSubtitle()}
        </div>
      </div>

      {/* 手動更新按鈕（非自動追蹤） */}
      {goal.track_source === "manual" && goal.status === "active" && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => onUpdateProgress?.(goal)}
        >
          更新進度
        </Button>
      )}

      {/* 狀態標籤 */}
      {(isCompleted || isPaused) && (
        <div className={`
          absolute top-2 right-12 text-xs px-2 py-1 rounded-full
          ${isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
        `}>
          {isCompleted ? "已完成" : "已暫停"}
        </div>
      )}
    </div>
  )
}

// Dashboard 用的目標區塊
interface GoalSectionProps {
  goals: Goal[]
  onManageClick: () => void
  onUpdateProgress: (goal: Goal) => void
}

export function GoalSection({ goals, onManageClick, onUpdateProgress }: GoalSectionProps) {
  const activeGoals = goals.filter(g => g.status === "active" && g.show_on_dashboard)

  if (activeGoals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🎯 目標追蹤</h3>
          <Button variant="outline" size="sm" onClick={onManageClick}>
            管理目標
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>還沒有設定目標</p>
          <Button variant="link" onClick={onManageClick} className="mt-2">
            建立第一個目標
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">🎯 目標追蹤</h3>
        <Button variant="outline" size="sm" onClick={onManageClick}>
          管理目標
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeGoals.slice(0, 6).map((goal) => (
          <GoalCard 
            key={goal.id} 
            goal={goal} 
            compact 
            onUpdateProgress={onUpdateProgress}
          />
        ))}
      </div>
      {activeGoals.length > 6 && (
        <div className="text-center mt-3">
          <Button variant="link" onClick={onManageClick}>
            查看全部 {activeGoals.length} 個目標
          </Button>
        </div>
      )}
    </div>
  )
}
