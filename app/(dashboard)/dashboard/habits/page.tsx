// app/(dashboard)/dashboard/habits/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, subDays, startOfWeek, endOfWeek } from "date-fns"
import { zhTW } from "date-fns/locale"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Flame,
  Calendar,
  MoreVertical,
  Pause,
  Play,
  ArrowLeft,
} from "lucide-react"
import type { Habit, HabitLog } from "@/types/database.types"

// 預設圖示選項
const ICON_OPTIONS = ["🎯", "📚", "🏃", "💪", "🧘", "💤", "💧", "🥗", "📝", "🎨", "🎵", "🌱"]

// 預設顏色選項
const COLOR_OPTIONS = [
  { value: "blue", label: "藍色", class: "bg-blue-500" },
  { value: "green", label: "綠色", class: "bg-green-500" },
  { value: "purple", label: "紫色", class: "bg-purple-500" },
  { value: "pink", label: "粉色", class: "bg-pink-500" },
  { value: "orange", label: "橘色", class: "bg-orange-500" },
  { value: "cyan", label: "青色", class: "bg-cyan-500" },
  { value: "red", label: "紅色", class: "bg-red-500" },
  { value: "yellow", label: "黃色", class: "bg-yellow-500" },
]

// 星期選項
const DAY_OPTIONS = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 7, label: "日" },
]

interface HabitWithStats extends Habit {
  weekLogs: Record<string, boolean>
  currentStreak: number
  totalCompleted: number
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithStats[]>([])
  const [loading, setLoading] = useState(true)

  // 編輯對話框
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "🎯",
    color: "blue",
    frequency: "daily" as "daily" | "weekly",
    target_days: [1, 2, 3, 4, 5, 6, 7] as number[],
  })
  const [saving, setSaving] = useState(false)

  // 刪除確認
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)

  // 選單狀態
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 本週日期
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  // 載入資料
  const fetchHabits = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得所有習慣
    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (!habitsData) {
      setLoading(false)
      return
    }

    // 取得本週打卡記錄
    const weekStartStr = format(weekStart, "yyyy-MM-dd")
    const weekEndStr = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")

    const { data: logsData } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", weekStartStr)
      .lte("date", weekEndStr)

    // 取得連續天數統計
    const { data: allLogsData } = await supabase
      .from("habit_logs")
      .select("habit_id, date")
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("date", { ascending: false })

    // 計算每個習慣的統計
    const habitsWithStats: HabitWithStats[] = habitsData.map(habit => {
      // 本週打卡狀態
      const weekLogs: Record<string, boolean> = {}
      weekDates.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd")
        const log = logsData?.find(l => l.habit_id === habit.id && l.date === dateStr)
        weekLogs[dateStr] = !!log?.completed
      })

      // 計算連續天數
      const habitLogs = allLogsData?.filter(l => l.habit_id === habit.id) || []
      let currentStreak = 0
      const todayStr = format(today, "yyyy-MM-dd")
      
      // 從今天往前數
      let checkDate = new Date(today)
      for (let i = 0; i < 365; i++) {
        const checkDateStr = format(checkDate, "yyyy-MM-dd")
        const hasLog = habitLogs.some(l => l.date === checkDateStr)
        
        // 檢查這天是否是目標天
        const dayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay()
        const isTargetDay = habit.target_days?.includes(dayOfWeek)
        
        if (isTargetDay) {
          if (hasLog) {
            currentStreak++
          } else if (checkDateStr !== todayStr) {
            // 如果不是今天且沒打卡，中斷連續
            break
          }
        }
        
        checkDate = subDays(checkDate, 1)
      }

      return {
        ...habit,
        weekLogs,
        currentStreak,
        totalCompleted: habitLogs.length,
      }
    })

    setHabits(habitsWithStats)
    setLoading(false)
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  // 打卡/取消打卡
  const toggleLog = async (habit: HabitWithStats, date: Date) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dateStr = format(date, "yyyy-MM-dd")
    const hasLog = habit.weekLogs[dateStr]

    if (hasLog) {
      // 取消打卡
      await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habit.id)
        .eq("date", dateStr)
    } else {
      // 打卡
      await supabase
        .from("habit_logs")
        .insert({
          habit_id: habit.id,
          user_id: user.id,
          date: dateStr,
          completed: true,
        })
    }

    fetchHabits()
  }

  // 開啟新增/編輯對話框
  const openDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit)
      setFormData({
        title: habit.title,
        description: habit.description || "",
        icon: habit.icon || "🎯",
        color: habit.color || "blue",
        frequency: (habit.frequency as "daily" | "weekly") || "daily",
        target_days: habit.target_days || [1, 2, 3, 4, 5, 6, 7],
      })
    } else {
      setEditingHabit(null)
      setFormData({
        title: "",
        description: "",
        icon: "🎯",
        color: "blue",
        frequency: "daily",
        target_days: [1, 2, 3, 4, 5, 6, 7],
      })
    }
    setDialogOpen(true)
    setOpenMenuId(null)
  }

  // 儲存
  const handleSave = async () => {
    if (!formData.title.trim()) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const habitData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      icon: formData.icon,
      color: formData.color,
      frequency: formData.frequency,
      target_days: formData.target_days,
    }

    if (editingHabit) {
      await supabase
        .from("habits")
        .update(habitData)
        .eq("id", editingHabit.id)
    } else {
      await supabase
        .from("habits")
        .insert({
          ...habitData,
          user_id: user.id,
          is_active: true,
        })
    }

    setSaving(false)
    setDialogOpen(false)
    fetchHabits()
  }

  // 切換啟用/暫停
  const toggleActive = async (habit: Habit) => {
    await supabase
      .from("habits")
      .update({ is_active: !habit.is_active })
      .eq("id", habit.id)
    
    setOpenMenuId(null)
    fetchHabits()
  }

  // 刪除
  const handleDelete = async () => {
    if (!deletingHabit) return

    // 先刪除相關的打卡記錄
    await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", deletingHabit.id)

    // 再刪除習慣
    await supabase
      .from("habits")
      .delete()
      .eq("id", deletingHabit.id)

    setDeleteDialogOpen(false)
    setDeletingHabit(null)
    fetchHabits()
  }

  // 開啟刪除確認
  const openDeleteDialog = (habit: Habit) => {
    setDeletingHabit(habit)
    setDeleteDialogOpen(true)
    setOpenMenuId(null)
  }

  // 切換目標天
  const toggleTargetDay = (day: number) => {
    const newDays = formData.target_days.includes(day)
      ? formData.target_days.filter(d => d !== day)
      : [...formData.target_days, day].sort()
    setFormData({ ...formData, target_days: newDays })
  }

  // 取得顏色 class
  const getColorClass = (color: string) => {
    return COLOR_OPTIONS.find(c => c.value === color)?.class || "bg-blue-500"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeHabits = habits.filter(h => h.is_active)
  const pausedHabits = habits.filter(h => !h.is_active)

  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回總覽
        </Button>
      </Link>

      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-7 h-7 text-cyan-600" />
            習慣管理
          </h1>
          <p className="text-gray-600 mt-1">養成好習慣，每天進步一點點</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          新增習慣
        </Button>
      </div>

      {/* 本週概覽 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600" />
            本週打卡
          </h2>
          <span className="text-sm text-gray-500">
            {format(weekStart, "M/d", { locale: zhTW })} - {format(weekDates[6], "M/d", { locale: zhTW })}
          </span>
        </div>

        {activeHabits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>還沒有建立習慣</p>
            <Button onClick={() => openDialog()} variant="outline" className="mt-3">
              <Plus className="w-4 h-4 mr-2" />
              建立第一個習慣
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left p-2 text-sm font-medium text-gray-500 w-48">習慣</th>
                  {weekDates.map(date => {
                    const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
                    return (
                      <th key={date.toISOString()} className="p-2 text-center">
                        <div className={`text-xs ${isToday ? "text-cyan-600 font-bold" : "text-gray-500"}`}>
                          {format(date, "EEE", { locale: zhTW })}
                        </div>
                        <div className={`text-sm ${isToday ? "text-cyan-600 font-bold" : "text-gray-700"}`}>
                          {format(date, "d")}
                        </div>
                      </th>
                    )
                  })}
                  <th className="p-2 text-center text-sm font-medium text-gray-500 w-20">連續</th>
                  <th className="p-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {activeHabits.map(habit => {
                  const colorClass = getColorClass(habit.color || "blue")
                  return (
                    <tr key={habit.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{habit.icon || "🎯"}</span>
                          <div>
                            <div className="font-medium text-gray-800">{habit.title}</div>
                            {habit.description && (
                              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                {habit.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const dateStr = format(date, "yyyy-MM-dd")
                        const isCompleted = habit.weekLogs[dateStr]
                        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
                        const isTargetDay = habit.target_days?.includes(dayOfWeek)
                        const isPast = date < today && format(date, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd")

                        return (
                          <td key={dateStr} className="p-2 text-center">
                            {isTargetDay ? (
                              <button
                                onClick={() => toggleLog(habit, date)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? `${colorClass} text-white shadow-md`
                                    : isPast
                                    ? "bg-red-100 text-red-400 border-2 border-red-200"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-gray-200"
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4" />
                                ) : isPast ? (
                                  <X className="w-4 h-4" />
                                ) : null}
                              </button>
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center text-gray-300">
                                —
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame className={`w-4 h-4 ${habit.currentStreak > 0 ? "text-orange-500" : "text-gray-300"}`} />
                          <span className={`font-medium ${habit.currentStreak > 0 ? "text-orange-600" : "text-gray-400"}`}>
                            {habit.currentStreak}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === habit.id ? null : habit.id)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {openMenuId === habit.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-md shadow-lg border py-1">
                                <button
                                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => openDialog(habit)}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  編輯
                                </button>
                                <button
                                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => toggleActive(habit)}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  暫停
                                </button>
                                <button
                                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  onClick={() => openDeleteDialog(habit)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  刪除
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 已暫停的習慣 */}
      {pausedHabits.length > 0 && (
        <div className="bg-gray-50 rounded-lg border p-4">
          <h2 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <Pause className="w-4 h-4" />
            已暫停的習慣
          </h2>
          <div className="space-y-2">
            {pausedHabits.map(habit => (
              <div key={habit.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-xl opacity-50">{habit.icon || "🎯"}</span>
                  <span className="text-gray-500">{habit.title}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(habit)}>
                    <Play className="w-3 h-3 mr-1" />
                    恢復
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => openDeleteDialog(habit)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計卡片 */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-cyan-600">{activeHabits.length}</div>
            <div className="text-sm text-gray-500">進行中習慣</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {activeHabits.reduce((sum, h) => sum + Object.values(h.weekLogs).filter(Boolean).length, 0)}
            </div>
            <div className="text-sm text-gray-500">本週打卡次數</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {Math.max(...activeHabits.map(h => h.currentStreak), 0)}
            </div>
            <div className="text-sm text-gray-500">最長連續天數</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {habits.reduce((sum, h) => sum + h.totalCompleted, 0)}
            </div>
            <div className="text-sm text-gray-500">累計完成次數</div>
          </div>
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHabit ? "編輯習慣" : "新增習慣"}
            </DialogTitle>
            <DialogDescription>
              設定習慣的名稱、圖示和執行天數
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>習慣名稱 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：每日閱讀、運動30分鐘"
              />
            </div>

            <div className="space-y-2">
              <Label>說明</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="選填，簡單描述這個習慣"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>圖示</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                        formData.icon === icon
                          ? "border-cyan-500 bg-cyan-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>顏色</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full ${color.class} transition-all ${
                        formData.color === color.value
                          ? "ring-2 ring-offset-2 ring-gray-400"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>執行天數</Label>
              <div className="flex gap-2">
                {DAY_OPTIONS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleTargetDay(day.value)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.target_days.includes(day.value)
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                選擇需要執行的星期，未選擇的日期不需要打卡
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title.trim() || formData.target_days.length === 0 || saving}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除「{deletingHabit?.title}」後，所有打卡記錄也會一併刪除，無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
