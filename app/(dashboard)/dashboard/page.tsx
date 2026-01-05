// app/(dashboard)/dashboard/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { CalendarView, type DayIndicators } from "@/components/calendar/calendar-view"
import { GoalSection, type Goal } from "@/components/goals/goal-card"
import { GoalDialog, UpdateProgressDialog } from "@/components/goals/goal-dialog"
import { useGoalProgress } from "@/lib/hooks/use-goal-progress"
import { BookOpen, FileQuestion, AlertCircle, Layers, BarChart2, Timer } from "lucide-react"
import { ReminderSection } from "@/components/dashboard/reminder-section"
import { addDays, getDay } from "date-fns"

interface Habit {
  id: string
  name: string
  icon: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<"month" | "week">("month")
  const [loading, setLoading] = useState(true)
  const [indicators, setIndicators] = useState<DayIndicators>({})

  // 目標相關狀態
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { syncGoalsProgress } = useGoalProgress()

  // 提醒相關狀態
  const [reminderLoading, setReminderLoading] = useState(true)
  const [urgentTasks, setUrgentTasks] = useState<any[]>([])
  const [todayPlans, setTodayPlans] = useState<any[]>([])
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])

  // ============================================
  // 載入指示器資料（日曆上的點點）
  // ============================================
  const fetchIndicators = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
    const startStr = format(startDate, "yyyy-MM-dd")
    const endStr = format(endDate, "yyyy-MM-dd")

    const newIndicators: DayIndicators = {}

    // 課表
    const { data: scheduleData } = await supabase
      .from("schedule_slots")
      .select("day_of_week")
      .eq("user_id", user.id)

    if (scheduleData && scheduleData.length > 0) {
      const daysWithSchedule = new Set(scheduleData.map(s => s.day_of_week))
      let current = new Date(startDate)
      while (current <= endDate) {
        const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay()
        if (daysWithSchedule.has(dayOfWeek)) {
          const dateKey = format(current, "yyyy-MM-dd")
          if (!newIndicators[dateKey]) newIndicators[dateKey] = []
          newIndicators[dateKey].push("schedule")
        }
        current.setDate(current.getDate() + 1)
      }
    }

    // 任務
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("due_date")
      .eq("user_id", user.id)
      .gte("due_date", startStr)
      .lte("due_date", endStr)

    if (tasksData) {
      tasksData.forEach(task => {
        if (task.due_date) {
          if (!newIndicators[task.due_date]) newIndicators[task.due_date] = []
          if (!newIndicators[task.due_date].includes("tasks")) {
            newIndicators[task.due_date].push("tasks")
          }
        }
      })
    }

    // 習慣打卡
    const { data: habitsData } = await supabase
      .from("habit_logs")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (habitsData) {
      habitsData.forEach(h => {
        if (!newIndicators[h.date]) newIndicators[h.date] = []
        if (!newIndicators[h.date].includes("habits")) {
          newIndicators[h.date].push("habits")
        }
      })
    }

    // 每日行程
    const { data: plansData } = await supabase
      .from("daily_plans")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (plansData) {
      plansData.forEach(p => {
        if (!newIndicators[p.date]) newIndicators[p.date] = []
        if (!newIndicators[p.date].includes("daily_plan")) {
          newIndicators[p.date].push("daily_plan")
        }
      })
    }

    // 生活日誌
    const { data: lifeJournals } = await supabase
      .from("journals_life")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (lifeJournals) {
      lifeJournals.forEach(j => {
        if (!newIndicators[j.date]) newIndicators[j.date] = []
        if (!newIndicators[j.date].includes("journal_life")) {
          newIndicators[j.date].push("journal_life")
        }
      })
    }

    // 學習日誌
    const { data: learningJournals } = await supabase
      .from("journals_learning")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (learningJournals) {
      learningJournals.forEach(j => {
        if (!newIndicators[j.date]) newIndicators[j.date] = []
        if (!newIndicators[j.date].includes("journal_learning")) {
          newIndicators[j.date].push("journal_learning")
        }
      })
    }

    // 閱讀日誌
    const { data: readingJournals } = await supabase
      .from("journals_reading")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (readingJournals) {
      readingJournals.forEach(j => {
        if (!newIndicators[j.date]) newIndicators[j.date] = []
        if (!newIndicators[j.date].includes("journal_reading")) {
          newIndicators[j.date].push("journal_reading")
        }
      })
    }

    // 感恩日誌
    const { data: gratitudeJournals } = await supabase
      .from("journals_gratitude")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (gratitudeJournals) {
      gratitudeJournals.forEach(j => {
        if (!newIndicators[j.date]) newIndicators[j.date] = []
        if (!newIndicators[j.date].includes("journal_gratitude")) {
          newIndicators[j.date].push("journal_gratitude")
        }
      })
    }

    // 遊覽日誌
    const { data: travelJournals } = await supabase
      .from("journals_travel")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (travelJournals) {
      travelJournals.forEach(j => {
        if (!newIndicators[j.date]) newIndicators[j.date] = []
        if (!newIndicators[j.date].includes("journal_travel")) {
          newIndicators[j.date].push("journal_travel")
        }
      })
    }

    // 收支
    const { data: financeData } = await supabase
      .from("finance_records")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (financeData) {
      financeData.forEach(f => {
        if (!newIndicators[f.date]) newIndicators[f.date] = []
        if (!newIndicators[f.date].includes("finance")) {
          newIndicators[f.date].push("finance")
        }
      })
    }

    // 運動
    const { data: exerciseData } = await supabase
      .from("health_exercises")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (exerciseData) {
      exerciseData.forEach(e => {
        if (!newIndicators[e.date]) newIndicators[e.date] = []
        if (!newIndicators[e.date].includes("exercise")) {
          newIndicators[e.date].push("exercise")
        }
      })
    }

    // 健康
    const { data: healthData } = await supabase
      .from("health_metrics")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)

    if (healthData) {
      healthData.forEach(h => {
        if (!newIndicators[h.date]) newIndicators[h.date] = []
        if (!newIndicators[h.date].includes("health")) {
          newIndicators[h.date].push("health")
        }
      })
    }

    setIndicators(newIndicators)
    setLoading(false)
  }, [])

  // ============================================
  // 載入目標資料
  // ============================================
  const fetchGoals = useCallback(async () => {
    setGoalsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setGoalsLoading(false)
      return
    }

    setUserId(user.id)

    // 載入習慣列表（供目標對話框使用）
    const { data: habitsData } = await supabase
      .from("habits")
      .select("id, title, icon")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("title")

    if (habitsData) {
      setHabits(habitsData.map(h => ({
        id: h.id,
        name: h.title,  // habits 表用 title 不是 name
        icon: h.icon || "✅"
      })))
    }

    // 載入目標
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "paused"])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (!error && data) {
      // 同步自動追蹤目標的進度
      const goalsData = data as Goal[]
      const hasAutoTrack = goalsData.some(g => g.track_source !== "manual" && g.status === "active")
      
      if (hasAutoTrack) {
        const updatedGoals = await syncGoalsProgress(goalsData, user.id)
        setGoals(updatedGoals)
      } else {
        setGoals(goalsData)
      }
    }
    setGoalsLoading(false)
  }, [syncGoalsProgress])

  // 儲存目標
  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    try {
      if (goalData.id) {
        // 更新 - 移除 id 後更新
        const { id, user_id, created_at, updated_at, ...updateFields } = goalData
        await supabase.from("goals").update(updateFields).eq("id", id)
      } else {
        // 新增 - 確保必填欄位存在
        if (!goalData.title || !goalData.goal_type) {
          console.error("缺少必填欄位")
          setSaving(false)
          return
        }
        
        await supabase.from("goals").insert({
          user_id: user.id,
          title: goalData.title,
          goal_type: goalData.goal_type,
          description: goalData.description ?? null,
          icon: goalData.icon ?? "🎯",
          color: goalData.color ?? "blue",
          start_value: goalData.start_value ?? null,
          target_value: goalData.target_value ?? null,
          current_value: goalData.current_value ?? null,
          unit: goalData.unit ?? null,
          direction: goalData.direction ?? "increase",
          target_count: goalData.target_count ?? null,
          current_count: goalData.current_count ?? 0,
          target_date: goalData.target_date ?? null,
          period_type: goalData.period_type ?? "once",
          period_target: goalData.period_target ?? null,
          deadline: goalData.deadline ?? null,
          track_source: goalData.track_source ?? "manual",
          track_config: goalData.track_config ?? null,
        })
      }
      await fetchGoals()
      setGoalDialogOpen(false)
      setEditingGoal(null)
    } catch (error) {
      console.error("儲存目標失敗:", error)
    } finally {
      setSaving(false)
    }
  }

  // 更新進度
  const handleUpdateProgress = async (goalId: string, value: number) => {
    setSaving(true)
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const updateData: Record<string, number | string | null> = {}
      
      if (goal.goal_type === "numeric") {
        updateData.current_value = value
        // 檢查是否達成
        if (goal.direction === "decrease" && value <= (goal.target_value || 0)) {
          updateData.status = "completed"
          updateData.completed_at = new Date().toISOString()
        } else if (goal.direction === "increase" && value >= (goal.target_value || 0)) {
          updateData.status = "completed"
          updateData.completed_at = new Date().toISOString()
        }
      } else if (goal.goal_type === "streak" || goal.goal_type === "count") {
        updateData.current_count = value
        // 檢查是否達成
        if (value >= (goal.target_count || 0)) {
          updateData.status = "completed"
          updateData.completed_at = new Date().toISOString()
        }
      }

      await supabase.from("goals").update(updateData).eq("id", goalId)
      await fetchGoals()
      setUpdateProgressOpen(false)
      setSelectedGoal(null)
    } catch (error) {
      console.error("更新進度失敗:", error)
    } finally {
      setSaving(false)
    }
  }

  // 開啟更新進度對話框
  const openUpdateProgress = (goal: Goal) => {
    setSelectedGoal(goal)
    setUpdateProgressOpen(true)
  }

  // ============================================
  // 載入提醒資料
  // ============================================
  const fetchReminders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReminderLoading(false)
      return
    }

    const today = new Date()
    const todayStr = format(today, "yyyy-MM-dd")
    const threeDaysLater = format(addDays(today, 3), "yyyy-MM-dd")

    // 1. 取得緊急任務（已過期或未來三天內到期，且未完成）
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .lte("due_date", threeDaysLater)
      .order("due_date", { ascending: true })

    if (tasksData) {
      setUrgentTasks(tasksData)
    }

    // 2. 取得今日行程
    const { data: plansData } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .order("start_time", { ascending: true, nullsFirst: false })

    if (plansData) {
      setTodayPlans(plansData)
    }

    // 3. 取得今日課表
    const jsDay = getDay(today)
    const dayOfWeek = jsDay === 0 ? 7 : jsDay

    const { data: scheduleData } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .order("slot_number", { ascending: true })

    if (scheduleData) {
      setTodaySchedule(scheduleData)
    }

    setReminderLoading(false)
  }, [])

  // 初始載入
  useEffect(() => {
    fetchIndicators()
    fetchGoals()
    fetchReminders()
  }, [fetchIndicators, fetchGoals, fetchReminders])

  // 點擊日期 → 跳轉到日期詳情頁
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    const dateStr = format(date, "yyyy-MM-dd")
    router.push(`/dashboard/day/${dateStr}`)
  }

  // ============================================
  // Loading
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ============================================
  // 主渲染
  // ============================================
  return (
    <div className="space-y-6">
      {/* 日曆 */}
      <CalendarView
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        indicators={indicators}
        view={calendarView}
        onViewChange={setCalendarView}
      />

      {/* ⚠️ 今日提醒 */}
      <ReminderSection
        urgentTasks={urgentTasks}
        todayPlans={todayPlans}
        todaySchedule={todaySchedule}
        loading={reminderLoading}
      />

      {/* 🎯 目標追蹤 */}
      {!goalsLoading && (
        <GoalSection
          goals={goals}
          onManageClick={() => router.push("/dashboard/goals")}
          onUpdateProgress={openUpdateProgress}
        />
      )}

      {/* 學習平台快速入口 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 學習平台</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button 
            onClick={() => router.push("/dashboard/subjects")} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">重點整理</span>
          </button>
          <button 
            onClick={() => router.push("/dashboard/practice")} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">題庫練習</span>
          </button>
          <button 
            onClick={() => router.push("/dashboard/mistakes")} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">錯題本</span>
          </button>
          <button 
            onClick={() => router.push("/dashboard/flashcards")} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">記憶卡片</span>
          </button>
          <button 
            onClick={() => router.push("/dashboard/pomodoro")} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">番茄鐘</span>
          </button>
          <button 
            onClick={() => router.push("/dashboard/stats")} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">學習統計</span>
          </button>
        </div>
      </div>

      {/* 目標對話框 */}
      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        onSave={handleSaveGoal}
        saving={saving}
        editGoal={editingGoal}
        habits={habits}
      />

      {/* 更新進度對話框 */}
      <UpdateProgressDialog
        open={updateProgressOpen}
        onOpenChange={setUpdateProgressOpen}
        goal={selectedGoal}
        onSave={handleUpdateProgress}
        saving={saving}
      />
    </div>
  )
}
