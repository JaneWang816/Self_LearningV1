// app/(dashboard)/dashboard/day/[date]/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO, getDay, addDays, addWeeks, addMonths, addYears, isBefore } from "date-fns"
import { zhTW } from "date-fns/locale"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  ArrowLeft,
} from "lucide-react"

// Panels
import {
  SchedulePanel,
  TaskPanel,
  HabitPanel,
  DailyPlanPanel,
  JournalLifePanel,
  JournalLearningPanel,
  JournalReadingPanel,
  JournalGratitudePanel,
  JournalTravelPanel,
  FinancePanel,
  ExercisePanel,
  HealthPanel,
} from "@/components/dashboard/panels"

// Dialogs
import {
  TaskDialog,
  JournalLifeDialog,
  JournalLearningDialog,
  JournalReadingDialog,
  JournalGratitudeDialog,
  JournalTravelDialog,
  FinanceDialog,
  ExerciseDialog,
  HealthDialog,
  DailyPlanDialog,
} from "@/components/dashboard/dialogs"

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
} from "@/types/custom"

// 類型定義
type JournalTravel = {
  id: string
  user_id: string
  date: string
  title: string
  location: string
  duration_minutes: number | null
  content: string | null
  mood: number | null
  weather: string | null
  companions: string | null
  rating: number | null
  photos: string[] | null
  created_at: string
  updated_at: string
}

type DailyPlan = {
  id: string
  user_id: string
  date: string
  title: string
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  location: string | null
  description: string | null
  color: string
  recurrence_type: string
  recurrence_end_date: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

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
  | "journals_travel"
  | "daily_plans"

// 模組設定
const MODULES = [
  { key: "schedule", icon: Calendar, label: "課表", color: "blue" },
  { key: "tasks", icon: CheckSquare, label: "任務", color: "amber" },
  { key: "habits", icon: Target, label: "習慣打卡", color: "cyan" },
  { key: "daily_plan", icon: CalendarClock, label: "每日行程", color: "indigo" },
  { key: "journal_life", icon: FileText, label: "生活日誌", color: "pink" },
  { key: "journal_learning", icon: GraduationCap, label: "學習日誌", color: "purple" },
  { key: "journal_reading", icon: BookMarked, label: "閱讀日誌", color: "green" },
  { key: "journal_gratitude", icon: Heart, label: "感恩日誌", color: "yellow" },
  { key: "journal_travel", icon: Compass, label: "遊覽日誌", color: "sky" },
  { key: "finance", icon: Wallet, label: "收支記錄", color: "emerald" },
  { key: "exercise", icon: Dumbbell, label: "運動記錄", color: "orange" },
  { key: "health", icon: Activity, label: "健康數據", color: "red" },
]

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-600" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600" },
  sky: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600" },
}

export default function DayDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dateStr = params.date as string
  const selectedDate = parseISO(dateStr)
  const selectedDateKey = dateStr

  // 展開狀態
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [moduleLoading, setModuleLoading] = useState<string | null>(null)

  // 各模組資料
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<HabitWithLog[]>([])
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([])
  const [journalLife, setJournalLife] = useState<JournalLife | null>(null)
  const [journalLearning, setJournalLearning] = useState<JournalLearning | null>(null)
  const [journalReading, setJournalReading] = useState<JournalReading | null>(null)
  const [journalGratitude, setJournalGratitude] = useState<JournalGratitude | null>(null)
  const [journalTravels, setJournalTravels] = useState<JournalTravel[]>([])
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([])
  const [exercises, setExercises] = useState<HealthExercise[]>([])
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])

  // 對話框狀態
  const [dialogType, setDialogType] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const dateLabel = format(selectedDate, "M月d日", { locale: zhTW })

  // ============================================
  // 資料載入函數
  // ============================================
  const fetchSchedule = useCallback(async () => {
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
  }, [selectedDate])

  const fetchTasks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("due_date", selectedDateKey)
      .order("is_important", { ascending: false })
    setTasks((data ?? []) as Task[])
  }, [selectedDateKey])

  const fetchHabits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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

    const { data: rawLogsData } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)

    const logsData = (rawLogsData ?? []) as HabitLog[]
    const logsMap = new Map(logsData.map(l => [l.habit_id, l]))

    const jsDay = getDay(selectedDate)
    const dayOfWeek = jsDay === 0 ? 7 : jsDay

    const filteredHabits: HabitWithLog[] = habitsData
      .filter(h => h.target_days?.includes(dayOfWeek))
      .map(h => ({ ...h, log: logsMap.get(h.id) }))

    setHabits(filteredHabits)
  }, [selectedDate, selectedDateKey])

  const fetchDailyPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("is_all_day", { ascending: false })
      .order("start_time", { ascending: true })
    setDailyPlans((data ?? []) as DailyPlan[])
  }, [selectedDateKey])

  const fetchJournalLife = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_life")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .maybeSingle()
    setJournalLife(data as JournalLife | null)
  }, [selectedDateKey])

  const fetchJournalLearning = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_learning")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .maybeSingle()
    setJournalLearning(data as JournalLearning | null)
  }, [selectedDateKey])

  const fetchJournalReading = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_reading")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .maybeSingle()
    setJournalReading(data as JournalReading | null)
  }, [selectedDateKey])

  const fetchJournalGratitude = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_gratitude")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .maybeSingle()
    setJournalGratitude(data as JournalGratitude | null)
  }, [selectedDateKey])

  const fetchJournalTravel = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("journals_travel")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setJournalTravels((data ?? []) as JournalTravel[])
  }, [selectedDateKey])

  const fetchFinance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("finance_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setFinanceRecords((data ?? []) as FinanceRecord[])
  }, [selectedDateKey])

  const fetchExercises = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("health_exercises")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setExercises((data ?? []) as HealthExercise[])
  }, [selectedDateKey])

  const fetchHealthMetrics = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDateKey)
      .order("created_at", { ascending: false })
    setHealthMetrics((data ?? []) as HealthMetric[])
  }, [selectedDateKey])

  // 載入模組資料
  const loadModuleData = useCallback(async (moduleKey: string) => {
    setModuleLoading(moduleKey)
    switch (moduleKey) {
      case "schedule": await fetchSchedule(); break
      case "tasks": await fetchTasks(); break
      case "habits": await fetchHabits(); break
      case "daily_plan": await fetchDailyPlans(); break
      case "journal_life": await fetchJournalLife(); break
      case "journal_learning": await fetchJournalLearning(); break
      case "journal_reading": await fetchJournalReading(); break
      case "journal_gratitude": await fetchJournalGratitude(); break
      case "journal_travel": await fetchJournalTravel(); break
      case "finance": await fetchFinance(); break
      case "exercise": await fetchExercises(); break
      case "health": await fetchHealthMetrics(); break
    }
    setModuleLoading(null)
  }, [
    fetchSchedule, fetchTasks, fetchHabits, fetchDailyPlans,
    fetchJournalLife, fetchJournalLearning, fetchJournalReading,
    fetchJournalGratitude, fetchJournalTravel, fetchFinance,
    fetchExercises, fetchHealthMetrics
  ])

  // 初始載入
  useEffect(() => {
    setLoading(false)
  }, [])

  // ============================================
  // 操作函數
  // ============================================
  // 切換模組展開狀態並載入資料
  const toggleModule = async (moduleKey: string) => {
    const isCurrentlyExpanded = expandedModules.includes(moduleKey)
    
    if (isCurrentlyExpanded) {
      // 收合
      setExpandedModules(prev => prev.filter(k => k !== moduleKey))
    } else {
      // 展開並載入資料
      setExpandedModules(prev => [...prev, moduleKey])
      await loadModuleData(moduleKey)
    }
  }

  const toggleTaskComplete = async (task: Task) => {
    const newCompletedAt = task.completed_at ? null : new Date().toISOString()
    await supabase.from("tasks").update({ completed_at: newCompletedAt }).eq("id", task.id)
    fetchTasks()
  }

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
  }

  const openDialog = (type: string, data?: Record<string, any>) => {
    setDialogType(type)
    setFormData(data || { color: "blue", recurrence_type: "none" })
    if (type === "journal_travel") {
      setPhotoUrls(data?.photos || [])
    }
  }

  const closeDialog = () => {
    setDialogType(null)
    setFormData({})
    setPhotoUrls([])
  }

  // 產生重複行程
  const generateRecurringPlans = async (
    basePlan: Record<string, any>,
    userId: string,
    startDate: Date
  ) => {
    const recurrenceType = basePlan.recurrence_type
    if (!recurrenceType || recurrenceType === "none") return

    const endDate = basePlan.recurrence_end_date 
      ? parseISO(basePlan.recurrence_end_date) 
      : addYears(startDate, 1)

    const plans: any[] = []
    let currentDate = startDate

    const getNextDate = (date: Date): Date => {
      switch (recurrenceType) {
        case "daily": return addDays(date, 1)
        case "weekly": return addWeeks(date, 1)
        case "monthly": return addMonths(date, 1)
        case "yearly": return addYears(date, 1)
        default: return date
      }
    }

    let count = 0
    currentDate = getNextDate(currentDate)
    
    while (isBefore(currentDate, endDate) && count < 365) {
      plans.push({
        user_id: userId,
        date: format(currentDate, "yyyy-MM-dd"),
        title: basePlan.title,
        start_time: basePlan.start_time || null,
        end_time: basePlan.end_time || null,
        is_all_day: basePlan.is_all_day || false,
        location: basePlan.location || null,
        description: basePlan.description || null,
        color: basePlan.color || "blue",
        recurrence_type: recurrenceType,
        recurrence_end_date: basePlan.recurrence_end_date || null,
        parent_id: basePlan.id,
      })
      currentDate = getNextDate(currentDate)
      count++
    }

    if (plans.length > 0) {
      await supabase.from("daily_plans").insert(plans)
    }
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

        case "daily_plan":
          if (formData.id) {
            await supabase.from("daily_plans").update({
              title: formData.title,
              start_time: formData.start_time || null,
              end_time: formData.end_time || null,
              is_all_day: formData.is_all_day || false,
              location: formData.location || null,
              description: formData.description || null,
              color: formData.color || "blue",
            }).eq("id", formData.id)
          } else {
            const { data: newPlan } = await supabase.from("daily_plans").insert({
              user_id: user.id,
              date: selectedDateKey,
              title: formData.title,
              start_time: formData.start_time || null,
              end_time: formData.end_time || null,
              is_all_day: formData.is_all_day || false,
              location: formData.location || null,
              description: formData.description || null,
              color: formData.color || "blue",
              recurrence_type: formData.recurrence_type || "none",
              recurrence_end_date: formData.recurrence_end_date || null,
            }).select().single()

            if (newPlan && formData.recurrence_type && formData.recurrence_type !== "none") {
              await generateRecurringPlans(newPlan, user.id, selectedDate)
            }
          }
          fetchDailyPlans()
          break

        case "journal_life":
          const lifeData = {
            content: formData.content,
            mood: formData.mood ? parseInt(formData.mood) : null,
            title: formData.title || null,
          }
          if (journalLife) {
            await supabase.from("journals_life").update(lifeData).eq("id", journalLife.id)
          } else {
            await supabase.from("journals_life").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...lifeData,
            })
          }
          fetchJournalLife()
          break

        case "journal_learning":
          const learningData = {
            content: formData.content,
            title: formData.title || null,
            subject_id: formData.subject_id || null,
            duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
            difficulty: formData.difficulty ? parseInt(formData.difficulty) : null,
          }
          if (journalLearning) {
            await supabase.from("journals_learning").update(learningData).eq("id", journalLearning.id)
          } else {
            await supabase.from("journals_learning").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...learningData,
            })
          }
          fetchJournalLearning()
          break

        case "journal_reading":
          const readingData = {
            book_title: formData.book_title,
            author: formData.author || null,
            pages_read: formData.pages_read ? parseInt(formData.pages_read) : null,
            current_page: formData.current_page ? parseInt(formData.current_page) : null,
            total_pages: formData.total_pages ? parseInt(formData.total_pages) : null,
            content: formData.content || null,
            rating: formData.rating ? parseInt(formData.rating) : null,
            is_finished: formData.is_finished || false,
          }
          if (journalReading) {
            await supabase.from("journals_reading").update(readingData).eq("id", journalReading.id)
          } else {
            await supabase.from("journals_reading").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...readingData,
            })
          }
          fetchJournalReading()
          break

        case "journal_gratitude":
          const gratitudeData = {
            content: formData.content,
          }
          if (journalGratitude) {
            await supabase.from("journals_gratitude").update(gratitudeData).eq("id", journalGratitude.id)
          } else {
            await supabase.from("journals_gratitude").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...gratitudeData,
            })
          }
          fetchJournalGratitude()
          break

        case "journal_travel":
          const travelData = {
            title: formData.title,
            location: formData.location,
            duration_minutes: formData.duration_minutes || null,
            content: formData.content || null,
            mood: formData.mood || null,
            weather: formData.weather || null,
            companions: formData.companions || null,
            rating: formData.rating || null,
            photos: photoUrls.length > 0 ? photoUrls : null,
          }
          if (formData.id) {
            await supabase.from("journals_travel").update(travelData).eq("id", formData.id)
          } else {
            await supabase.from("journals_travel").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...travelData,
            })
          }
          fetchJournalTravel()
          break

        case "finance":
          const financeData = {
            type: formData.type,
            amount: formData.amount,
            category: formData.category || null,
            description: formData.description || null,
          }
          if (formData.id) {
            await supabase.from("finance_records").update(financeData).eq("id", formData.id)
          } else {
            await supabase.from("finance_records").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...financeData,
            })
          }
          fetchFinance()
          break

        case "exercise":
          const exerciseData = {
            exercise_type: formData.exercise_type,
            duration_minutes: formData.duration_minutes || null,
            calories: formData.calories || null,
            note: formData.note || null,
          }
          if (formData.id) {
            await supabase.from("health_exercises").update(exerciseData).eq("id", formData.id)
          } else {
            await supabase.from("health_exercises").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...exerciseData,
            })
          }
          fetchExercises()
          break

        case "health":
          const healthData = {
            metric_type: formData.metric_type,
            value_primary: parseFloat(formData.value_primary),
            value_secondary: formData.value_secondary ? parseFloat(formData.value_secondary) : null,
            value_tertiary: formData.value_tertiary ? parseFloat(formData.value_tertiary) : null,
            measured_time: formData.measured_time || null,
            note: formData.note || null,
          }
          if (formData.id) {
            await supabase.from("health_metrics").update(healthData).eq("id", formData.id)
          } else {
            await supabase.from("health_metrics").insert({
              user_id: user.id,
              date: selectedDateKey,
              ...healthData,
            })
          }
          fetchHealthMetrics()
          break
      }

      closeDialog()
    } catch (error) {
      console.error("儲存失敗:", error)
    } finally {
      setSaving(false)
    }
  }

  // 刪除資料
  const handleDelete = async (table: DeletableTable, id: string, photos?: string[]) => {
    if (!confirm("確定要刪除嗎？")) return

    // 刪除照片
    if (photos && photos.length > 0) {
      const paths = photos.map(url => {
        const parts = url.split("/")
        return parts.slice(-2).join("/")
      })
      await supabase.storage.from("travel-photos").remove(paths)
    }

    await supabase.from(table).delete().eq("id", id)

    // 重新載入
    switch (table) {
      case "tasks": fetchTasks(); break
      case "daily_plans": fetchDailyPlans(); break
      case "journals_life": fetchJournalLife(); break
      case "journals_learning": fetchJournalLearning(); break
      case "journals_reading": fetchJournalReading(); break
      case "journals_gratitude": fetchJournalGratitude(); break
      case "journals_travel": fetchJournalTravel(); break
      case "finance_records": fetchFinance(); break
      case "health_exercises": fetchExercises(); break
      case "health_metrics": fetchHealthMetrics(); break
    }
  }

  // 切換日期
  const goToDate = (offset: number) => {
    const newDate = addDays(selectedDate, offset)
    router.push(`/dashboard/day/${format(newDate, "yyyy-MM-dd")}`)
  }

  // 渲染面板內容
  const renderPanelContent = (moduleKey: string) => {
    const panelColor = `${colorMap[MODULES.find(m => m.key === moduleKey)?.color || "blue"].bg} ${colorMap[MODULES.find(m => m.key === moduleKey)?.color || "blue"].border}`
    const isLoading = moduleLoading === moduleKey

    switch (moduleKey) {
      case "schedule":
        return <SchedulePanel slots={scheduleSlots} loading={isLoading} panelColor={panelColor} />
      case "tasks":
        return (
          <TaskPanel
            tasks={tasks}
            loading={isLoading}
            panelColor={panelColor}
            onAdd={() => openDialog("task")}
            onEdit={(task) => openDialog("task", task)}
            onToggleComplete={toggleTaskComplete}
            onDelete={(id) => handleDelete("tasks", id)}
          />
        )
      case "habits":
        return (
          <HabitPanel
            habits={habits}
            loading={isLoading}
            panelColor={panelColor}
            onToggle={toggleHabitLog}
          />
        )
      case "daily_plan":
        return (
          <DailyPlanPanel
            plans={dailyPlans}
            loading={isLoading}
            panelColor={panelColor}
            onAdd={() => openDialog("daily_plan")}
            onEdit={(plan) => openDialog("daily_plan", plan)}
            onDelete={(id) => handleDelete("daily_plans", id)}
          />
        )
      case "journal_life":
        return (
          <JournalLifePanel
            journal={journalLife}
            loading={isLoading}
            panelColor={panelColor}
            onEdit={() => openDialog("journal_life", journalLife || {})}
          />
        )
      case "journal_learning":
        return (
          <JournalLearningPanel
            journal={journalLearning}
            loading={isLoading}
            panelColor={panelColor}
            onEdit={() => openDialog("journal_learning", journalLearning || {})}
          />
        )
      case "journal_reading":
        return (
          <JournalReadingPanel
            journal={journalReading}
            loading={isLoading}
            panelColor={panelColor}
            onEdit={() => openDialog("journal_reading", journalReading || {})}
          />
        )
      case "journal_gratitude":
        return (
          <JournalGratitudePanel
            journal={journalGratitude}
            loading={isLoading}
            panelColor={panelColor}
            onEdit={() => openDialog("journal_gratitude", journalGratitude || {})}
          />
        )
      case "journal_travel":
        return (
          <JournalTravelPanel
            travels={journalTravels}
            loading={isLoading}
            panelColor={panelColor}
            onAdd={() => openDialog("journal_travel")}
            onEdit={(j) => openDialog("journal_travel", j)}
            onDelete={(id, photos) => handleDelete("journals_travel", id, photos)}
          />
        )
      case "finance":
        return (
          <FinancePanel
            records={financeRecords}
            loading={isLoading}
            panelColor={panelColor}
            onAdd={() => openDialog("finance", { type: "expense" })}
            onEdit={(record) => openDialog("finance", record)}
            onDelete={(id) => handleDelete("finance_records", id)}
          />
        )
      case "exercise":
        return (
          <ExercisePanel
            exercises={exercises}
            loading={isLoading}
            panelColor={panelColor}
            onAdd={() => openDialog("exercise")}
            onEdit={(ex) => openDialog("exercise", ex)}
            onDelete={(id) => handleDelete("health_exercises", id)}
          />
        )
      case "health":
        return (
          <HealthPanel
            metrics={healthMetrics}
            loading={isLoading}
            panelColor={panelColor}
            onAdd={() => openDialog("health", { metric_type: "weight" })}
            onEdit={(metric) => openDialog("health", metric)}
            onDelete={(id) => handleDelete("health_metrics", id)}
          />
        )
      default:
        return null
    }
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
    <div className="space-y-4">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => goToDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800 min-w-[140px] text-center">
            {format(selectedDate, "M月d日 EEEE", { locale: zhTW })}
          </h1>
          <Button variant="outline" size="icon" onClick={() => goToDate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/day/${format(new Date(), "yyyy-MM-dd")}`)}
        >
          今天
        </Button>
      </div>

      {/* 12 個可收合模組 */}
      <div className="space-y-2">
        {MODULES.map((module) => {
          const Icon = module.icon
          const isExpanded = expandedModules.includes(module.key)
          const colors = colorMap[module.color]

          return (
            <div key={module.key} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* 標題列（可點擊收合） */}
              <button
                onClick={() => toggleModule(module.key)}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <span className="font-medium text-gray-800">{module.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* 展開內容 */}
              {isExpanded && (
                <div className={`border-t ${colors.border}`}>
                  {renderPanelContent(module.key)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ============================================ */}
      {/* 對話框 */}
      {/* ============================================ */}
      <TaskDialog
        open={dialogType === "task"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!formData.id}
      />

      <DailyPlanDialog
        open={dialogType === "daily_plan"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!formData.id}
      />

      <JournalLifeDialog
        open={dialogType === "journal_life"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!journalLife}
      />

      <JournalLearningDialog
        open={dialogType === "journal_learning"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!journalLearning}
      />

      <JournalReadingDialog
        open={dialogType === "journal_reading"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!journalReading}
      />

      <JournalGratitudeDialog
        open={dialogType === "journal_gratitude"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!journalGratitude}
      />

      <JournalTravelDialog
        open={dialogType === "journal_travel"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        photos={photoUrls}
        setPhotos={setPhotoUrls}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!formData.id}
      />

      <FinanceDialog
        open={dialogType === "finance"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!formData.id}
      />

      <ExerciseDialog
        open={dialogType === "exercise"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!formData.id}
      />

      <HealthDialog
        open={dialogType === "health"}
        onOpenChange={(open) => !open && closeDialog()}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        dateLabel={dateLabel}
        isEdit={!!formData.id}
      />
    </div>
  )
}
