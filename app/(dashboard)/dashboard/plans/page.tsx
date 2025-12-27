// app/(dashboard)/dashboard/plans/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addDays, addWeeks, addYears } from "date-fns"
import { zhTW } from "date-fns/locale"
import { supabase } from "@/lib/supabaseClient"
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
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Repeat,
  Pencil,
  Trash2,
} from "lucide-react"

// 類型定義
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

// 常量
const PLAN_COLORS = [
  { value: "blue", label: "藍色", bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  { value: "red", label: "紅色", bg: "bg-red-500", light: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  { value: "green", label: "綠色", bg: "bg-green-500", light: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  { value: "yellow", label: "黃色", bg: "bg-yellow-500", light: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  { value: "purple", label: "紫色", bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  { value: "pink", label: "粉色", bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  { value: "orange", label: "橘色", bg: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  { value: "cyan", label: "青色", bg: "bg-cyan-500", light: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
]

const RECURRENCE_OPTIONS = [
  { value: "none", label: "不重複" },
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每週" },
  { value: "monthly", label: "每月" },
  { value: "yearly", label: "每年" },
]

const TIME_OPTIONS = (() => {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
    }
  }
  return times
})()

const getPlanColor = (color: string) => PLAN_COLORS.find(c => c.value === color) || PLAN_COLORS[0]
const formatTime = (time: string | null) => time ? time.substring(0, 5) : ""

export default function PlansPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [plans, setPlans] = useState<DailyPlan[]>([])
  const [loading, setLoading] = useState(true)

  // 對話框
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  // 刪除確認
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd")

  // 載入當月行程
  const fetchPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd")
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")

    const { data } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date")
      .order("is_all_day", { ascending: false })
      .order("start_time")

    setPlans((data || []) as DailyPlan[])
    setLoading(false)
  }, [currentMonth])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // 日曆資料
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 補齊前面的空白
  const startDayOfWeek = monthStart.getDay()
  const prefixDays = Array(startDayOfWeek).fill(null)

  // 取得某天的行程
  const getPlansForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    return plans.filter(p => p.date === dateKey)
  }

  // 選定日期的行程
  const selectedDayPlans = getPlansForDate(selectedDate)

  // 開啟對話框
  const openDialog = (data?: DailyPlan) => {
    setFormData(data || { color: "blue", recurrence_type: "none" })
    setDialogOpen(true)
  }

  // 產生重複行程
  const generateRecurringPlans = async (basePlan: any, userId: string, startDate: Date) => {
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

    while (currentDate <= endDate && count < 365) {
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

  // 儲存
  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    try {
      if (formData.id) {
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

        if (!error && newPlan && formData.recurrence_type && formData.recurrence_type !== "none") {
          await generateRecurringPlans({ ...formData, id: newPlan.id }, user.id, selectedDate)
        }
      }
      fetchPlans()
    } catch (error) {
      console.error("儲存失敗:", error)
    }

    setSaving(false)
    setDialogOpen(false)
    setFormData({})
  }

  // 刪除
  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from("daily_plans").delete().eq("parent_id", deleteId)
    await supabase.from("daily_plans").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchPlans()
  }

  const isAllDay = formData.is_all_day || false
  const hasRecurrence = formData.recurrence_type && formData.recurrence_type !== "none"

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarClock className="w-7 h-7 text-indigo-600" />
          每日行程
        </h1>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" /> 新增行程
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 月曆 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4">
          {/* 月份導覽 */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "yyyy年 M月", { locale: zhTW })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 mb-2">
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {prefixDays.map((_, i) => (
              <div key={`prefix-${i}`} className="aspect-square" />
            ))}
            {calendarDays.map((day) => {
              const dayPlans = getPlansForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 rounded-lg border transition-all text-left
                    ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-transparent hover:bg-gray-50"}
                    ${isToday ? "ring-2 ring-indigo-300" : ""}
                  `}
                >
                  <div className={`text-sm font-medium ${isToday ? "text-indigo-600" : "text-gray-700"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="mt-0.5 space-y-0.5 overflow-hidden max-h-12">
                    {dayPlans.slice(0, 3).map((plan) => {
                      const color = getPlanColor(plan.color)
                      return (
                        <div
                          key={plan.id}
                          className={`text-xs truncate px-1 rounded ${color.light} ${color.text}`}
                        >
                          {plan.title}
                        </div>
                      )
                    })}
                    {dayPlans.length > 3 && (
                      <div className="text-xs text-gray-400">+{dayPlans.length - 3} 更多</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 選定日期的行程列表 */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {format(selectedDate, "M月d日 EEEE", { locale: zhTW })}
            </h3>
            <Button size="sm" onClick={() => openDialog()}>
              <Plus className="w-3 h-3 mr-1" /> 新增
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedDayPlans.length === 0 ? (
            <p className="text-center text-gray-500 py-8">這天沒有行程</p>
          ) : (
            <div className="space-y-2">
              {selectedDayPlans.map((plan) => {
                const color = getPlanColor(plan.color)
                return (
                  <div
                    key={plan.id}
                    className={`p-3 rounded-lg border-l-4 ${color.border} bg-gray-50`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{plan.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                          {plan.is_all_day ? (
                            <span>全天</span>
                          ) : plan.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(plan.start_time)}
                              {plan.end_time && ` - ${formatTime(plan.end_time)}`}
                            </span>
                          )}
                          {plan.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {plan.location}
                            </span>
                          )}
                          {plan.recurrence_type !== "none" && (
                            <span className="flex items-center gap-1">
                              <Repeat className="w-3 h-3" />
                              {RECURRENCE_OPTIONS.find(o => o.value === plan.recurrence_type)?.label}
                            </span>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(plan)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(plan.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>{formData.id ? "編輯行程" : "新增行程"}</DialogTitle>
            <DialogDescription>{format(selectedDate, "M月d日", { locale: zhTW })}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">標題 *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例：討論作業"
                className="h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_all_day"
                checked={isAllDay}
                onCheckedChange={(c) => setFormData({
                  ...formData,
                  is_all_day: c,
                  start_time: c ? null : formData.start_time,
                  end_time: c ? null : formData.end_time,
                })}
              />
              <Label htmlFor="is_all_day" className="text-sm cursor-pointer">全天事件</Label>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">開始</Label>
                  <Select value={formData.start_time || ""} onValueChange={(v) => setFormData({ ...formData, start_time: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="時間" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">結束</Label>
                  <Select value={formData.end_time || ""} onValueChange={(v) => setFormData({ ...formData, end_time: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="時間" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">地點</Label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="選填"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">顏色</Label>
              <div className="flex flex-wrap gap-2">
                {PLAN_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-7 h-7 rounded-full ${color.bg} transition-all ${
                      formData.color === color.value ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">重複</Label>
                <Select
                  value={formData.recurrence_type || "none"}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    recurrence_type: v,
                    recurrence_end_date: v === "none" ? null : formData.recurrence_end_date
                  })}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasRecurrence && (
                <div className="space-y-1">
                  <Label className="text-xs">到期日</Label>
                  <Input
                    type="date"
                    value={formData.recurrence_end_date || ""}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value || null })}
                    className="h-9"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">備註</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="選填"
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !formData.title}>
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作會刪除此行程及所有相關的重複行程，無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
