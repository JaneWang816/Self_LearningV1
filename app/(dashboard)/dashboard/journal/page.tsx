// app/(dashboard)/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { format, addDays, addWeeks, addMonths, addYears, isBefore, parseISO } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { CalendarView, type ModuleType } from "@/components/calendar/calendar-view"
import { useDashboardData, type JournalTravel, type DailyPlan } from "@/lib/hooks/use-dashboard-data"
import { ModuleButtonGrid, getModuleConfig } from "@/components/dashboard/module-buttons"
import { BookOpen, FileQuestion, AlertCircle, Layers } from "lucide-react"

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
  Task,
  FinanceRecord,
  HealthExercise,
  HealthMetric,
} from "@/types/custom"

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

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<"month" | "week">("month")
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  // 使用自定義 Hook 獲取資料
  const {
    loading,
    moduleLoading,
    indicators,
    selectedDateKey,
    scheduleSlots,
    tasks,
    habits,
    dailyPlans,
    journalLife,
    journalLearning,
    journalReading,
    journalGratitude,
    journalTravels,
    financeRecords,
    exercises,
    healthMetrics,
    setJournalLife,
    setJournalLearning,
    setJournalReading,
    setJournalGratitude,
    fetchIndicators,
    loadModuleData,
    fetchTasks,
    fetchHabits,
    fetchDailyPlans,
    fetchJournalLife,
    fetchJournalLearning,
    fetchJournalReading,
    fetchJournalGratitude,
    fetchJournalTravel,
    fetchFinance,
    fetchExercises,
    fetchHealthMetrics,
  } = useDashboardData(selectedDate)

  // 對話框狀態
  const [dialogType, setDialogType] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const dateLabel = format(selectedDate, "M月d日", { locale: zhTW })
  const selectedIndicators = indicators[selectedDateKey] || []

  // 載入模組資料
  useEffect(() => {
    if (expandedModule) {
      loadModuleData(expandedModule)
    }
  }, [selectedDate, expandedModule, loadModuleData])

  // ============================================
  // 操作函數
  // ============================================
  const handleModuleClick = (moduleKey: string) => {
    setExpandedModule(expandedModule === moduleKey ? null : moduleKey)
  }

  const toggleTaskComplete = async (task: Task) => {
    const newCompletedAt = task.completed_at ? null : new Date().toISOString()
    await supabase.from("tasks").update({ completed_at: newCompletedAt }).eq("id", task.id)
    fetchTasks()
    fetchIndicators()
  }

  const toggleHabitLog = async (habit: any) => {
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

  // ============================================
  // 產生重複行程
  // ============================================
  const generateRecurringPlans = async (
    basePlan: Record<string, any>,
    userId: string,
    startDate: Date
  ) => {
    const recurrenceType = basePlan.recurrence_type
    if (!recurrenceType || recurrenceType === "none") return

    const endDate = basePlan.recurrence_end_date 
      ? parseISO(basePlan.recurrence_end_date) 
      : addYears(startDate, 1) // 預設一年

    const plans: any[] = []
    let currentDate = startDate

    // 產生下一個日期
    const getNextDate = (date: Date): Date => {
      switch (recurrenceType) {
        case "daily": return addDays(date, 1)
        case "weekly": return addWeeks(date, 1)
        case "monthly": return addMonths(date, 1)
        case "yearly": return addYears(date, 1)
        default: return date
      }
    }

    // 產生重複行程（最多 365 筆）
    let count = 0
    currentDate = getNextDate(currentDate) // 從下一個週期開始
    
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
        parent_id: basePlan.id, // 指向原始行程
      })
      currentDate = getNextDate(currentDate)
      count++
    }

    if (plans.length > 0) {
      await supabase.from("daily_plans").insert(plans)
    }
  }

  // ============================================
  // 儲存表單
  // ============================================
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
            // 編輯現有行程
            await supabase.from("daily_plans").update({
              title: formData.title,
              start_time: formData.is_all_day ? null : formData.start_time,
              end_time: formData.is_all_day ? null : formData.end_time,
              is_all_day: formData.is_all_day || false,
              location: formData.location || null,
              description: formData.description || null,
              color: formData.color || "blue",
              recurrence_type: formData.recurrence_type || "none",
              recurrence_end_date: formData.recurrence_end_date || null,
            }).eq("id", formData.id)
          } else {
            // 新增行程
            const { data: newPlan, error } = await supabase.from("daily_plans").insert({
              user_id: user.id,
              date: selectedDateKey,
              title: formData.title,
              start_time: formData.is_all_day ? null : formData.start_time,
              end_time: formData.is_all_day ? null : formData.end_time,
              is_all_day: formData.is_all_day || false,
              location: formData.location || null,
              description: formData.description || null,
              color: formData.color || "blue",
              recurrence_type: formData.recurrence_type || "none",
              recurrence_end_date: formData.recurrence_end_date || null,
            }).select().single()

            // 如果有重複，產生後續行程
            if (!error && newPlan && formData.recurrence_type && formData.recurrence_type !== "none") {
              await generateRecurringPlans(
                { ...formData, id: newPlan.id },
                user.id,
                selectedDate
              )
            }
          }
          fetchDailyPlans()
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

        case "journal_travel":
          if (formData.id) {
            await supabase.from("journals_travel").update({
              title: formData.title,
              location: formData.location,
              duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
              content: formData.content,
              mood: formData.mood,
              weather: formData.weather,
              companions: formData.companions,
              rating: formData.rating,
              photos: photoUrls,
            }).eq("id", formData.id)
          } else {
            await supabase.from("journals_travel").insert({
              user_id: user.id,
              date: selectedDateKey,
              title: formData.title,
              location: formData.location,
              duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
              content: formData.content,
              mood: formData.mood,
              weather: formData.weather,
              companions: formData.companions,
              rating: formData.rating,
              photos: photoUrls,
            })
          }
          fetchJournalTravel()
          break

        case "finance":
          if (formData.id) {
            await supabase.from("finance_records").update({
              type: formData.type,
              category_id: formData.category_id || null,
              category: formData.category,
              amount: parseFloat(formData.amount),
              description: formData.description,
            }).eq("id", formData.id)
          } else {
            await supabase.from("finance_records").insert({
              user_id: user.id,
              type: formData.type,
              category_id: formData.category_id || null,
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
    closeDialog()
  }

  // ============================================
  // 刪除記錄
  // ============================================
  const handleDelete = async (table: DeletableTable, id: string, photos?: string[]) => {
    // 如果有照片，先刪除照片
    if (photos && photos.length > 0) {
      const paths = photos.map(url => url.split("/travel-photos/")[1]).filter(Boolean)
      if (paths.length > 0) {
        await supabase.storage.from("travel-photos").remove(paths)
      }
    }

    // 如果是行程，也刪除所有子行程
    if (table === "daily_plans") {
      await supabase.from("daily_plans").delete().eq("parent_id", id)
    }

    await supabase.from(table).delete().eq("id", id)
    
    switch (table) {
      case "tasks": fetchTasks(); break
      case "daily_plans": fetchDailyPlans(); break
      case "finance_records": fetchFinance(); break
      case "health_exercises": fetchExercises(); break
      case "health_metrics": fetchHealthMetrics(); break
      case "journals_life": setJournalLife(null); break
      case "journals_learning": setJournalLearning(null); break
      case "journals_reading": setJournalReading(null); break
      case "journals_gratitude": setJournalGratitude(null); break
      case "journals_travel": fetchJournalTravel(); break
    }
    fetchIndicators()
  }

  // ============================================
  // 渲染面板
  // ============================================
  const renderPanel = () => {
    if (!expandedModule) return null

    const config = getModuleConfig(expandedModule)
    if (!config) return null

    switch (expandedModule) {
      case "schedule":
        return <SchedulePanel slots={scheduleSlots} loading={moduleLoading} panelColor={config.panelColor} />
      
      case "tasks":
        return (
          <TaskPanel
            tasks={tasks}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onAdd={() => openDialog("task")}
            onEdit={(task) => openDialog("task", task)}
            onDelete={(id) => handleDelete("tasks", id)}
            onToggleComplete={toggleTaskComplete}
          />
        )
      
      case "habits":
        return (
          <HabitPanel
            habits={habits}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onToggle={toggleHabitLog}
          />
        )

      case "daily_plan":
        return (
          <DailyPlanPanel
            plans={dailyPlans}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onAdd={() => openDialog("daily_plan")}
            onEdit={(plan) => openDialog("daily_plan", plan)}
            onDelete={(id) => handleDelete("daily_plans", id)}
          />
        )
      
      case "journal_life":
        return (
          <JournalLifePanel
            journal={journalLife}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onEdit={() => openDialog("journal_life", journalLife || {})}
          />
        )
      
      case "journal_learning":
        return (
          <JournalLearningPanel
            journal={journalLearning}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onEdit={() => openDialog("journal_learning", journalLearning || {})}
          />
        )
      
      case "journal_reading":
        return (
          <JournalReadingPanel
            journal={journalReading}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onEdit={() => openDialog("journal_reading", journalReading || {})}
          />
        )
      
      case "journal_gratitude":
        return (
          <JournalGratitudePanel
            journal={journalGratitude}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onEdit={() => openDialog("journal_gratitude", journalGratitude || {})}
          />
        )
      
      case "journal_travel":
        return (
          <JournalTravelPanel
            travels={journalTravels}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onAdd={() => openDialog("journal_travel")}
            onEdit={(travel) => openDialog("journal_travel", travel)}
            onDelete={(id, photos) => handleDelete("journals_travel", id, photos)}
          />
        )
      
      case "finance":
        return (
          <FinancePanel
            records={financeRecords}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onAdd={() => openDialog("finance", { type: "expense" })}
            onEdit={(record) => openDialog("finance", record)}
            onDelete={(id) => handleDelete("finance_records", id)}
          />
        )
      
      case "exercise":
        return (
          <ExercisePanel
            exercises={exercises}
            loading={moduleLoading}
            panelColor={config.panelColor}
            onAdd={() => openDialog("exercise")}
            onEdit={(ex) => openDialog("exercise", ex)}
            onDelete={(id) => handleDelete("health_exercises", id)}
          />
        )
      
      case "health":
        return (
          <HealthPanel
            metrics={healthMetrics}
            loading={moduleLoading}
            panelColor={config.panelColor}
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
        <ModuleButtonGrid
          expandedModule={expandedModule}
          selectedIndicators={selectedIndicators}
          onModuleClick={handleModuleClick}
        />

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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 學習平台</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        </div>
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
