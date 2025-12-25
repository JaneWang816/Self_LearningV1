// app/(dashboard)/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { format, getDay } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { CalendarView, type DayIndicators, type ModuleType } from "@/components/calendar/calendar-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  BookOpen,
  CheckSquare,
  FileText,
  GraduationCap,
  BookMarked,
  Heart,
  Wallet,
  Dumbbell,
  Activity,
  Target,
  Layers,
  FileQuestion,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  User,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Droplets,
  Moon,
  Scale,
} from "lucide-react"
import type {
  ScheduleSlot,
  Task,
  Habit,
  HabitLog,
  JournalLife,
  JournalLearning,
  JournalReading,
  JournalGratitude,
  FinanceRecord,
  HealthExercise,
  HealthMetric,
  TablesUpdate,
} from "@/types/database.types"

// Habit with today's log
type HabitWithLog = Habit & { log?: HabitLog }

type DeletableTable = 
  | "tasks" 
  | "finance_records" 
  | "health_exercises" 
  | "health_metrics"
  | "journals_life"
  | "journals_learning"
  | "journals_reading"
  | "journals_gratitude"

// 時段對照表
const SLOT_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "08:00", end: "08:50" },
  2: { start: "09:00", end: "09:50" },
  3: { start: "10:00", end: "10:50" },
  4: { start: "11:00", end: "11:50" },
  5: { start: "12:00", end: "12:50" },
  6: { start: "13:00", end: "13:50" },
  7: { start: "14:00", end: "14:50" },
  8: { start: "15:00", end: "15:50" },
  9: { start: "16:00", end: "16:50" },
  10: { start: "17:00", end: "17:50" },
}

// 心情圖示
const MOOD_ICONS = {
  1: { icon: Frown, label: "很差", color: "text-red-500" },
  2: { icon: Frown, label: "不好", color: "text-orange-500" },
  3: { icon: Meh, label: "普通", color: "text-yellow-500" },
  4: { icon: Smile, label: "不錯", color: "text-lime-500" },
  5: { icon: Smile, label: "很棒", color: "text-green-500" },
}

// 支出分類
const EXPENSE_CATEGORIES = ["飲食", "交通", "娛樂", "購物", "學習", "其他"]
const INCOME_CATEGORIES = ["零用錢", "獎學金", "打工", "禮金", "其他"]

// 運動類型
const EXERCISE_TYPES = ["跑步", "游泳", "籃球", "羽球", "健身", "瑜珈", "騎車", "走路", "其他"]

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<"month" | "week">("month")
  const [indicators, setIndicators] = useState<DayIndicators>({})
  const [loading, setLoading] = useState(true)

  // 展開面板狀態
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [moduleLoading, setModuleLoading] = useState(false)

  // 各模組資料
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<HabitWithLog[]>([])
  const [journalLife, setJournalLife] = useState<JournalLife | null>(null)
  const [journalLearning, setJournalLearning] = useState<JournalLearning | null>(null)
  const [journalReading, setJournalReading] = useState<JournalReading | null>(null)
  const [journalGratitude, setJournalGratitude] = useState<JournalGratitude | null>(null)
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([])
  const [exercises, setExercises] = useState<HealthExercise[]>([])
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])

  // 表單對話框
  const [dialogType, setDialogType] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd")

  // ============================================
  // 載入指示器資料
  // ============================================
  const fetchIndicators = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
          const dateKey = task.due_date
          if (!newIndicators[dateKey]) newIndicators[dateKey] = []
          if (!newIndicators[dateKey].includes("tasks")) {
            newIndicators[dateKey].push("tasks")
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
        const dateKey = h.date
        if (!newIndicators[dateKey]) newIndicators[dateKey] = []
        if (!newIndicators[dateKey].includes("habits")) {
          newIndicators[dateKey].push("habits")
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
  }

  // ============================================
  // 各模組資料載入函數
  // ============================================
  const fetchSchedule = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const jsDay = getDay(selectedDate)
    const dayOfWeek = jsDay === 0 ? 7 : jsDay
    const { data } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .order("slot_number", { ascending: true })
    setScheduleSlots((data ?? []) as ScheduleSlot[])
  }

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("due_date", selectedDateKey)
      .order("is_important", { ascending: false })
    setTasks((data ?? []) as Task[])
  }

  const fetchHabits = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得所有啟用的習慣
    const { data: rawHabitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)

    const habitsData = (rawHabitsData ?? []) as Habit[]

    if (habitsData.length === 0) {
      setHabits([])
      return
    }

    // 取得當日打卡記錄
    const { data: rawLogsData } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)

    const logsData = (rawLogsData ?? []) as HabitLog[]
    const logsMap = new Map(logsData.map(l => [l.habit_id, l]))

    // 過濾當天需要執行的習慣
    const jsDay = getDay(selectedDate)
    const dayOfWeek = jsDay === 0 ? 7 : jsDay

    const filteredHabits: HabitWithLog[] = habitsData
      .filter(h => h.target_days?.includes(dayOfWeek))
      .map(h => ({ ...h, log: logsMap.get(h.id) }))

    setHabits(filteredHabits)
  }

  const fetchJournalLife = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_life")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .single()
    setJournalLife(data as JournalLife | null)
  }

  const fetchJournalLearning = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_learning")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .single()
    setJournalLearning(data as JournalLearning | null)
  }

  const fetchJournalReading = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_reading")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .single()
    setJournalReading(data as JournalReading | null)
  }

  const fetchJournalGratitude = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_gratitude")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .single()
    setJournalGratitude(data as JournalGratitude | null)
  }

  const fetchFinance = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("finance_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setFinanceRecords((data ?? []) as FinanceRecord[])
  }

  const fetchExercises = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("health_exercises")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setExercises((data ?? []) as HealthExercise[])
  }

  const fetchHealthMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setHealthMetrics((data ?? []) as HealthMetric[])
  }

  // ============================================
  // 載入模組資料
  // ============================================
  const loadModuleData = async (moduleKey: string) => {
    setModuleLoading(true)
    switch (moduleKey) {
      case "schedule": await fetchSchedule(); break
      case "tasks": await fetchTasks(); break
      case "habits": await fetchHabits(); break
      case "journal_life": await fetchJournalLife(); break
      case "journal_learning": await fetchJournalLearning(); break
      case "journal_reading": await fetchJournalReading(); break
      case "journal_gratitude": await fetchJournalGratitude(); break
      case "finance": await fetchFinance(); break
      case "exercise": await fetchExercises(); break
      case "health": await fetchHealthMetrics(); break
    }
    setModuleLoading(false)
  }

  useEffect(() => {
    fetchIndicators()
  }, [])

  useEffect(() => {
    if (expandedModule) {
      loadModuleData(expandedModule)
    }
  }, [selectedDate, expandedModule])

  // ============================================
  // 操作函數
  // ============================================
  const handleModuleClick = async (moduleKey: string) => {
    if (expandedModule === moduleKey) {
      setExpandedModule(null)
    } else {
      setExpandedModule(moduleKey)
    }
  }

  // 任務完成切換
  const toggleTaskComplete = async (task: Task) => {
    const newCompletedAt = task.completed_at ? null : new Date().toISOString()
    await supabase
      .from("tasks")
      .update({ completed_at: newCompletedAt })
      .eq("id", task.id)
    fetchTasks()
    fetchIndicators()
  }

  // 習慣打卡
  const toggleHabitLog = async (habit: HabitWithLog) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (habit.log) {
      await supabase.from("habit_logs").delete().eq("id", habit.log.id)
    } else {
      await supabase.from("habit_logs").insert({
        habit_id: habit.id,
        user_id: user.id,
        date: selectedDateKey,
        completed: true,
      })
    }
    fetchHabits()
    fetchIndicators()
  }

  // 開啟編輯對話框
  const openDialog = (type: string, data?: Record<string, any>) => {
    setDialogType(type)
    setFormData(data || {})
  }

  // 儲存表單
  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    try {
      switch (dialogType) {
        case "task":
          if (formData.id) {
            await supabase.from("tasks").update({
              title: formData.title,
              description: formData.description,
              is_important: formData.is_important || false,
              is_urgent: formData.is_urgent || false,
            }).eq("id", formData.id)
          } else {
            await supabase.from("tasks").insert({
              user_id: user.id,
              title: formData.title,
              description: formData.description,
              is_important: formData.is_important || false,
              is_urgent: formData.is_urgent || false,
              due_date: selectedDateKey,
            })
          }
          fetchTasks()
          break

        case "journal_life":
          if (journalLife) {
            await supabase.from("journals_life").update({
              title: formData.title,
              content: formData.content,
              mood: formData.mood,
            }).eq("id", journalLife.id)
          } else {
            await supabase.from("journals_life").insert({
              user_id: user.id,
              title: formData.title,
              content: formData.content,
              mood: formData.mood,
              date: selectedDateKey,
            })
          }
          fetchJournalLife()
          break

        case "journal_learning":
          if (journalLearning) {
            await supabase.from("journals_learning").update({
              title: formData.title,
              content: formData.content,
              duration_minutes: formData.duration_minutes,
              difficulty: formData.difficulty,
            }).eq("id", journalLearning.id)
          } else {
            await supabase.from("journals_learning").insert({
              user_id: user.id,
              title: formData.title,
              content: formData.content,
              duration_minutes: formData.duration_minutes,
              difficulty: formData.difficulty,
              date: selectedDateKey,
            })
          }
          fetchJournalLearning()
          break

        case "journal_reading":
          if (journalReading) {
            await supabase.from("journals_reading").update({
              book_title: formData.book_title,
              author: formData.author,
              content: formData.content,
              pages_read: formData.pages_read,
              current_page: formData.current_page,
              total_pages: formData.total_pages,
              rating: formData.rating,
              is_finished: formData.is_finished,
            }).eq("id", journalReading.id)
          } else {
            await supabase.from("journals_reading").insert({
              user_id: user.id,
              book_title: formData.book_title,
              author: formData.author,
              content: formData.content,
              pages_read: formData.pages_read,
              current_page: formData.current_page,
              total_pages: formData.total_pages,
              rating: formData.rating,
              is_finished: formData.is_finished || false,
              date: selectedDateKey,
            })
          }
          fetchJournalReading()
          break

        case "journal_gratitude":
          if (journalGratitude) {
            await supabase.from("journals_gratitude").update({
              content: formData.content,
            }).eq("id", journalGratitude.id)
          } else {
            await supabase.from("journals_gratitude").insert({
              user_id: user.id,
              content: formData.content,
              date: selectedDateKey,
            })
          }
          fetchJournalGratitude()
          break

        case "finance":
          if (formData.id) {
            await supabase.from("finance_records").update({
              type: formData.type,
              category: formData.category,
              amount: parseFloat(formData.amount),
              description: formData.description,
            }).eq("id", formData.id)
          } else {
            await supabase.from("finance_records").insert({
              user_id: user.id,
              type: formData.type,
              category: formData.category,
              amount: parseFloat(formData.amount),
              description: formData.description,
              date: selectedDateKey,
            })
          }
          fetchFinance()
          break

        case "exercise":
          if (formData.id) {
            await supabase.from("health_exercises").update({
              exercise_type: formData.exercise_type,
              duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
              calories: formData.calories ? parseInt(formData.calories) : null,
              note: formData.note,
            }).eq("id", formData.id)
          } else {
            await supabase.from("health_exercises").insert({
              user_id: user.id,
              exercise_type: formData.exercise_type,
              duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
              calories: formData.calories ? parseInt(formData.calories) : null,
              note: formData.note,
              date: selectedDateKey,
            })
          }
          fetchExercises()
          break

        case "health":
          if (formData.id) {
            await supabase.from("health_metrics").update({
              metric_type: formData.metric_type,
              value_primary: parseFloat(formData.value_primary),
              value_secondary: formData.value_secondary ? parseFloat(formData.value_secondary) : null,
              note: formData.note,
            }).eq("id", formData.id)
          } else {
            await supabase.from("health_metrics").insert({
              user_id: user.id,
              metric_type: formData.metric_type,
              value_primary: parseFloat(formData.value_primary),
              value_secondary: formData.value_secondary ? parseFloat(formData.value_secondary) : null,
              note: formData.note,
              date: selectedDateKey,
            })
          }
          fetchHealthMetrics()
          break
      }
      fetchIndicators()
    } catch (error) {
      console.error("儲存失敗:", error)
    }

    setSaving(false)
    setDialogType(null)
    setFormData({})
  }

  // 刪除記錄
  const handleDelete = async (table: DeletableTable, id: string) => {
    await supabase.from(table).delete().eq("id", id)
    
    switch (table) {
      case "tasks": fetchTasks(); break
      case "finance_records": fetchFinance(); break
      case "health_exercises": fetchExercises(); break
      case "health_metrics": fetchHealthMetrics(); break
      case "journals_life": setJournalLife(null); break
      case "journals_learning": setJournalLearning(null); break
      case "journals_reading": setJournalReading(null); break
      case "journals_gratitude": setJournalGratitude(null); break
    }
    fetchIndicators()
  }

  // ============================================
  // 模組按鈕設定
  // ============================================
  const moduleButtons = [
    { key: "schedule", icon: Calendar, label: "課表", color: "bg-blue-500", panelColor: "bg-blue-50 border-blue-200" },
    { key: "tasks", icon: CheckSquare, label: "任務", color: "bg-amber-500", panelColor: "bg-amber-50 border-amber-200" },
    { key: "habits", icon: Target, label: "習慣打卡", color: "bg-cyan-500", panelColor: "bg-cyan-50 border-cyan-200" },
    { key: "journal_life", icon: FileText, label: "生活日誌", color: "bg-pink-500", panelColor: "bg-pink-50 border-pink-200" },
    { key: "journal_learning", icon: GraduationCap, label: "學習日誌", color: "bg-purple-500", panelColor: "bg-purple-50 border-purple-200" },
    { key: "journal_reading", icon: BookMarked, label: "閱讀日誌", color: "bg-green-500", panelColor: "bg-green-50 border-green-200" },
    { key: "journal_gratitude", icon: Heart, label: "感恩日誌", color: "bg-yellow-500", panelColor: "bg-yellow-50 border-yellow-200" },
    { key: "finance", icon: Wallet, label: "收支", color: "bg-emerald-500", panelColor: "bg-emerald-50 border-emerald-200" },
    { key: "exercise", icon: Dumbbell, label: "運動", color: "bg-orange-500", panelColor: "bg-orange-50 border-orange-200" },
    { key: "health", icon: Activity, label: "健康", color: "bg-red-500", panelColor: "bg-red-50 border-red-200" },
  ]

  const selectedIndicators = indicators[selectedDateKey] || []
  const currentModule = moduleButtons.find(m => m.key === expandedModule)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ============================================
  // 渲染展開面板
  // ============================================
  const renderPanel = () => {
    if (!expandedModule || !currentModule) return null

    if (moduleLoading) {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )
    }

    const Icon = currentModule.icon

    // 課表面板
    if (expandedModule === "schedule") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 當日課表
            </h4>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/schedule")}>
              <ExternalLink className="w-3 h-3 mr-1" /> 管理課表
            </Button>
          </div>
          {scheduleSlots.length === 0 ? (
            <p className="text-center py-6 text-gray-500">這天沒有課程安排</p>
          ) : (
            <div className="space-y-2">
              {scheduleSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-1 text-sm text-gray-500 w-28 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {SLOT_TIMES[slot.slot_number]?.start} - {SLOT_TIMES[slot.slot_number]?.end}
                  </div>
                  <div className="flex-1 font-medium">{slot.subject_name}</div>
                  {slot.teacher && <div className="flex items-center gap-1 text-sm text-gray-500"><User className="w-3.5 h-3.5" />{slot.teacher}</div>}
                  {slot.location && <div className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="w-3.5 h-3.5" />{slot.location}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // 任務面板
    if (expandedModule === "tasks") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 當日任務
            </h4>
            <Button size="sm" onClick={() => openDialog("task")} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-3 h-3 mr-1" /> 新增
            </Button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-center py-6 text-gray-500">這天沒有任務</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Checkbox checked={!!task.completed_at} onCheckedChange={() => toggleTaskComplete(task)} />
                  <div className={`flex-1 ${task.completed_at ? "line-through text-gray-400" : ""}`}>
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    {task.is_important && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">重要</span>}
                    {task.is_urgent && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded">緊急</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog("task", task)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete("tasks", task.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // 習慣打卡面板
    if (expandedModule === "habits") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 習慣打卡
            </h4>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/habits")}>
              <ExternalLink className="w-3 h-3 mr-1" /> 管理習慣
            </Button>
          </div>
          {habits.length === 0 ? (
            <p className="text-center py-6 text-gray-500">這天沒有需要執行的習慣</p>
          ) : (
            <div className="space-y-2">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <button
                    onClick={() => toggleHabitLog(habit)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      habit.log ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {habit.log ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <p className="font-medium">{habit.title}</p>
                    {habit.description && <p className="text-sm text-gray-500">{habit.description}</p>}
                  </div>
                  {habit.icon && <span className="text-xl">{habit.icon}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // 生活日誌面板
    if (expandedModule === "journal_life") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 生活日誌
            </h4>
            <Button size="sm" onClick={() => openDialog("journal_life", journalLife || {})} className="bg-pink-600 hover:bg-pink-700">
              {journalLife ? <><Pencil className="w-3 h-3 mr-1" /> 編輯</> : <><Plus className="w-3 h-3 mr-1" /> 撰寫</>}
            </Button>
          </div>
          {!journalLife ? (
            <p className="text-center py-6 text-gray-500">還沒寫今天的生活日誌</p>
          ) : (
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                {journalLife.title && <h5 className="font-medium">{journalLife.title}</h5>}
                {journalLife.mood && (
                  <div className="flex items-center gap-1">
                    {(() => { const M = MOOD_ICONS[journalLife.mood as keyof typeof MOOD_ICONS]; return M ? <M.icon className={`w-5 h-5 ${M.color}`} /> : null })()}
                    <span className="text-sm text-gray-500">{MOOD_ICONS[journalLife.mood as keyof typeof MOOD_ICONS]?.label}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{journalLife.content}</p>
            </div>
          )}
        </div>
      )
    }

    // 學習日誌面板
    if (expandedModule === "journal_learning") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 學習日誌
            </h4>
            <Button size="sm" onClick={() => openDialog("journal_learning", journalLearning || {})} className="bg-purple-600 hover:bg-purple-700">
              {journalLearning ? <><Pencil className="w-3 h-3 mr-1" /> 編輯</> : <><Plus className="w-3 h-3 mr-1" /> 撰寫</>}
            </Button>
          </div>
          {!journalLearning ? (
            <p className="text-center py-6 text-gray-500">還沒寫今天的學習日誌</p>
          ) : (
            <div className="bg-white rounded-lg border p-4">
              {journalLearning.title && <h5 className="font-medium mb-2">{journalLearning.title}</h5>}
              <p className="text-gray-700 whitespace-pre-wrap">{journalLearning.content}</p>
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                {journalLearning.duration_minutes && <span>⏱ {journalLearning.duration_minutes} 分鐘</span>}
                {journalLearning.difficulty && <span>難度: {"⭐".repeat(journalLearning.difficulty)}</span>}
              </div>
            </div>
          )}
        </div>
      )
    }

    // 閱讀日誌面板
    if (expandedModule === "journal_reading") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 閱讀日誌
            </h4>
            <Button size="sm" onClick={() => openDialog("journal_reading", journalReading || {})} className="bg-green-600 hover:bg-green-700">
              {journalReading ? <><Pencil className="w-3 h-3 mr-1" /> 編輯</> : <><Plus className="w-3 h-3 mr-1" /> 撰寫</>}
            </Button>
          </div>
          {!journalReading ? (
            <p className="text-center py-6 text-gray-500">還沒寫今天的閱讀日誌</p>
          ) : (
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">📖 {journalReading.book_title}</h5>
                {journalReading.is_finished && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded">已讀完</span>}
              </div>
              {journalReading.author && <p className="text-sm text-gray-500 mb-2">作者: {journalReading.author}</p>}
              {journalReading.content && <p className="text-gray-700 whitespace-pre-wrap">{journalReading.content}</p>}
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                {journalReading.pages_read && <span>今日讀 {journalReading.pages_read} 頁</span>}
                {journalReading.current_page && journalReading.total_pages && (
                  <span>進度: {journalReading.current_page}/{journalReading.total_pages}</span>
                )}
                {journalReading.rating && <span>評分: {"⭐".repeat(journalReading.rating)}</span>}
              </div>
            </div>
          )}
        </div>
      )
    }

    // 感恩日誌面板
    if (expandedModule === "journal_gratitude") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 感恩日誌
            </h4>
            <Button size="sm" onClick={() => openDialog("journal_gratitude", journalGratitude || {})} className="bg-yellow-600 hover:bg-yellow-700">
              {journalGratitude ? <><Pencil className="w-3 h-3 mr-1" /> 編輯</> : <><Plus className="w-3 h-3 mr-1" /> 撰寫</>}
            </Button>
          </div>
          {!journalGratitude ? (
            <p className="text-center py-6 text-gray-500">今天有什麼值得感恩的事？</p>
          ) : (
            <div className="bg-white rounded-lg border p-4">
              <p className="text-gray-700 whitespace-pre-wrap">🙏 {journalGratitude.content}</p>
            </div>
          )}
        </div>
      )
    }

    // 收支面板
    if (expandedModule === "finance") {
      const totalIncome = financeRecords.filter(r => r.type === "income").reduce((sum, r) => sum + Number(r.amount), 0)
      const totalExpense = financeRecords.filter(r => r.type === "expense").reduce((sum, r) => sum + Number(r.amount), 0)
      
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 收支記錄
            </h4>
            <Button size="sm" onClick={() => openDialog("finance", { type: "expense" })} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-3 h-3 mr-1" /> 新增
            </Button>
          </div>
          <div className="flex gap-4 mb-3 text-sm">
            <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> 收入: ${totalIncome}</span>
            <span className="text-red-600 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> 支出: ${totalExpense}</span>
            <span className={totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}>
              結餘: ${totalIncome - totalExpense}
            </span>
          </div>
          {financeRecords.length === 0 ? (
            <p className="text-center py-6 text-gray-500">這天沒有收支記錄</p>
          ) : (
            <div className="space-y-2">
              {financeRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${record.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {record.type === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{record.category}</p>
                    {record.description && <p className="text-sm text-gray-500">{record.description}</p>}
                  </div>
                  <span className={`font-semibold ${record.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {record.type === "income" ? "+" : "-"}${record.amount}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog("finance", record)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete("finance_records", record.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // 運動面板
    if (expandedModule === "exercise") {
      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 運動記錄
            </h4>
            <Button size="sm" onClick={() => openDialog("exercise")} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-3 h-3 mr-1" /> 新增
            </Button>
          </div>
          {exercises.length === 0 ? (
            <p className="text-center py-6 text-gray-500">這天沒有運動記錄</p>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <div key={ex.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{ex.exercise_type}</p>
                    {ex.note && <p className="text-sm text-gray-500">{ex.note}</p>}
                  </div>
                  {ex.duration_minutes && <span className="text-sm text-gray-500">{ex.duration_minutes} 分鐘</span>}
                  {ex.calories && <span className="text-sm text-gray-500">{ex.calories} 卡</span>}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog("exercise", ex)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete("health_exercises", ex.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // 健康面板
    if (expandedModule === "health") {
      const metricIcons: Record<string, React.ElementType> = {
        weight: Scale,
        sleep: Moon,
        water: Droplets,
        blood_pressure: Activity,
      }
      const metricLabels: Record<string, string> = {
        weight: "體重",
        sleep: "睡眠",
        water: "飲水",
        blood_pressure: "血壓",
      }
      const metricUnits: Record<string, string> = {
        weight: "kg",
        sleep: "小時",
        water: "ml",
        blood_pressure: "mmHg",
      }

      return (
        <div className={`mt-4 p-4 rounded-lg border ${currentModule.panelColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4" /> 健康數值
            </h4>
            <Button size="sm" onClick={() => openDialog("health", { metric_type: "weight" })} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-3 h-3 mr-1" /> 新增
            </Button>
          </div>
          {healthMetrics.length === 0 ? (
            <p className="text-center py-6 text-gray-500">這天沒有健康記錄</p>
          ) : (
            <div className="space-y-2">
              {healthMetrics.map((metric) => {
                const metricType = metric.metric_type || "weight"
                const MetricIcon = metricIcons[metricType] || Activity
                return (
                  <div key={metric.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <MetricIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{metricLabels[metricType] || metricType}</p>
                      {metric.note && <p className="text-sm text-gray-500">{metric.note}</p>}
                    </div>
                    <span className="font-semibold">
                      {metricType === "blood_pressure" && metric.value_secondary
                        ? `${metric.value_primary}/${metric.value_secondary}`
                        : metric.value_primary
                      } {metricUnits[metricType]}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog("health", metric)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete("health_metrics", metric.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  // ============================================
  // 渲染對話框
  // ============================================
  const renderDialog = () => {
    if (!dialogType) return null

    return (
      <Dialog open={!!dialogType} onOpenChange={() => { setDialogType(null); setFormData({}) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "task" && (formData.id ? "編輯任務" : "新增任務")}
              {dialogType === "journal_life" && (journalLife ? "編輯生活日誌" : "撰寫生活日誌")}
              {dialogType === "journal_learning" && (journalLearning ? "編輯學習日誌" : "撰寫學習日誌")}
              {dialogType === "journal_reading" && (journalReading ? "編輯閱讀日誌" : "撰寫閱讀日誌")}
              {dialogType === "journal_gratitude" && (journalGratitude ? "編輯感恩日誌" : "撰寫感恩日誌")}
              {dialogType === "finance" && (formData.id ? "編輯收支" : "新增收支")}
              {dialogType === "exercise" && (formData.id ? "編輯運動" : "新增運動")}
              {dialogType === "health" && (formData.id ? "編輯健康數值" : "新增健康數值")}
            </DialogTitle>
            <DialogDescription>
              {format(selectedDate, "M月d日", { locale: zhTW })} 的記錄
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 任務表單 */}
            {dialogType === "task" && (
              <>
                <div className="space-y-2">
                  <Label>任務名稱 *</Label>
                  <Input value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>說明</Label>
                  <Textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.is_important || false} onCheckedChange={(c) => setFormData({ ...formData, is_important: c })} />
                    <span>重要</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.is_urgent || false} onCheckedChange={(c) => setFormData({ ...formData, is_urgent: c })} />
                    <span>緊急</span>
                  </label>
                </div>
              </>
            )}

            {/* 生活日誌表單 */}
            {dialogType === "journal_life" && (
              <>
                <div className="space-y-2">
                  <Label>標題</Label>
                  <Input value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>內容 *</Label>
                  <Textarea value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>今日心情</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((m) => {
                      const M = MOOD_ICONS[m as keyof typeof MOOD_ICONS]
                      return (
                        <button key={m} onClick={() => setFormData({ ...formData, mood: m })}
                          className={`p-2 rounded-lg border-2 transition-all ${formData.mood === m ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                          <M.icon className={`w-6 h-6 ${M.color}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 學習日誌表單 */}
            {dialogType === "journal_learning" && (
              <>
                <div className="space-y-2">
                  <Label>標題</Label>
                  <Input value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>內容 *</Label>
                  <Textarea value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>學習時長 (分鐘)</Label>
                    <Input type="number" value={formData.duration_minutes || ""} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>難度 (1-5)</Label>
                    <Select value={String(formData.difficulty || "")} onValueChange={(v) => setFormData({ ...formData, difficulty: parseInt(v) })}>
                      <SelectTrigger><SelectValue placeholder="選擇" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((d) => <SelectItem key={d} value={String(d)}>{"⭐".repeat(d)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* 閱讀日誌表單 */}
            {dialogType === "journal_reading" && (
              <>
                <div className="space-y-2">
                  <Label>書名 *</Label>
                  <Input value={formData.book_title || ""} onChange={(e) => setFormData({ ...formData, book_title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>作者</Label>
                  <Input value={formData.author || ""} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>心得</Label>
                  <Textarea value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>今日讀頁數</Label>
                    <Input type="number" value={formData.pages_read || ""} onChange={(e) => setFormData({ ...formData, pages_read: parseInt(e.target.value) || null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>目前頁數</Label>
                    <Input type="number" value={formData.current_page || ""} onChange={(e) => setFormData({ ...formData, current_page: parseInt(e.target.value) || null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>總頁數</Label>
                    <Input type="number" value={formData.total_pages || ""} onChange={(e) => setFormData({ ...formData, total_pages: parseInt(e.target.value) || null })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.is_finished || false} onCheckedChange={(c) => setFormData({ ...formData, is_finished: c })} />
                    <span>已讀完</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Label>評分</Label>
                    <Select value={String(formData.rating || "")} onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) })}>
                      <SelectTrigger className="w-24"><SelectValue placeholder="選擇" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((r) => <SelectItem key={r} value={String(r)}>{"⭐".repeat(r)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* 感恩日誌表單 */}
            {dialogType === "journal_gratitude" && (
              <div className="space-y-2">
                <Label>今天感恩的事 *</Label>
                <Textarea value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} placeholder="寫下今天值得感恩的事..." />
              </div>
            )}

            {/* 收支表單 */}
            {dialogType === "finance" && (
              <>
                <div className="space-y-2">
                  <Label>類型</Label>
                  <Select value={formData.type || "expense"} onValueChange={(v) => setFormData({ ...formData, type: v, category: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">支出</SelectItem>
                      <SelectItem value="income">收入</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>分類 *</Label>
                  <Select value={formData.category || ""} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
                    <SelectContent>
                      {(formData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>金額 *</Label>
                  <Input type="number" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>備註</Label>
                  <Input value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </>
            )}

            {/* 運動表單 */}
            {dialogType === "exercise" && (
              <>
                <div className="space-y-2">
                  <Label>運動類型 *</Label>
                  <Select value={formData.exercise_type || ""} onValueChange={(v) => setFormData({ ...formData, exercise_type: v })}>
                    <SelectTrigger><SelectValue placeholder="選擇類型" /></SelectTrigger>
                    <SelectContent>
                      {EXERCISE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>時長 (分鐘)</Label>
                    <Input type="number" value={formData.duration_minutes || ""} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>消耗熱量 (卡)</Label>
                    <Input type="number" value={formData.calories || ""} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>備註</Label>
                  <Input value={formData.note || ""} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                </div>
              </>
            )}

            {/* 健康數值表單 */}
            {dialogType === "health" && (
              <>
                <div className="space-y-2">
                  <Label>類型 *</Label>
                  <Select value={formData.metric_type || "weight"} onValueChange={(v) => setFormData({ ...formData, metric_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">體重 (kg)</SelectItem>
                      <SelectItem value="sleep">睡眠 (小時)</SelectItem>
                      <SelectItem value="water">飲水 (ml)</SelectItem>
                      <SelectItem value="blood_pressure">血壓 (mmHg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{formData.metric_type === "blood_pressure" ? "收縮壓 *" : "數值 *"}</Label>
                    <Input type="number" step="0.1" value={formData.value_primary || ""} onChange={(e) => setFormData({ ...formData, value_primary: e.target.value })} />
                  </div>
                  {formData.metric_type === "blood_pressure" && (
                    <div className="space-y-2">
                      <Label>舒張壓 *</Label>
                      <Input type="number" value={formData.value_secondary || ""} onChange={(e) => setFormData({ ...formData, value_secondary: e.target.value })} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>備註</Label>
                  <Input value={formData.note || ""} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogType(null); setFormData({}) }}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        onSelectDate={setSelectedDate}
        indicators={indicators}
        view={calendarView}
        onViewChange={setCalendarView}
      />

      {/* 選定日期詳情 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📆 {format(selectedDate, "M月d日 EEEE", { locale: zhTW })}
        </h3>

        {/* 模組按鈕網格 */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {moduleButtons.map((module) => {
            const Icon = module.icon
            const hasData = selectedIndicators.includes(module.key as ModuleType)
            const isExpanded = expandedModule === module.key

            return (
              <button
                key={module.key}
                onClick={() => handleModuleClick(module.key)}
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

        {/* 展開面板 */}
        {renderPanel()}

        {/* 提示文字 */}
        {!expandedModule && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            點擊上方按鈕查看或編輯該日的記錄
          </p>
        )}
      </div>

      {/* 學習平台快速入口 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📚 學習平台
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => router.push("/dashboard/subjects")} className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-sm font-medium text-gray-700 mt-2">重點整理</span>
          </button>
          <button onClick={() => router.push("/dashboard/practice")} className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500"><FileQuestion className="w-6 h-6 text-white" /></div>
            <span className="text-sm font-medium text-gray-700 mt-2">題庫練習</span>
          </button>
          <button onClick={() => router.push("/dashboard/mistakes")} className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500"><AlertCircle className="w-6 h-6 text-white" /></div>
            <span className="text-sm font-medium text-gray-700 mt-2">錯題本</span>
          </button>
          <button onClick={() => router.push("/dashboard/flashcards")} className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500"><Layers className="w-6 h-6 text-white" /></div>
            <span className="text-sm font-medium text-gray-700 mt-2">記憶卡片</span>
          </button>
        </div>
      </div>

      {/* 對話框 */}
      {renderDialog()}
    </div>
  )
}
