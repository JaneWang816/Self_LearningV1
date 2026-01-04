// app/(dashboard)/tasks/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  AlertTriangle,
  Clock,
  CalendarDays,
  Trash2,
  MoreVertical,
  Pencil,
  CheckCircle2,
  Circle,
  ListTodo,
  Flame,
  Timer,
  Coffee,
  Repeat,
  RefreshCw,
} from "lucide-react"
import type { Task } from "@/types/custom"

// 擴展 Task 類型以包含例行任務欄位
type TaskWithRecurrence = Task

// 四象限類型
type Quadrant = "do_first" | "schedule" | "delegate" | "eliminate"

// 篩選類型
type FilterType = "all" | "pending" | "completed"

// 重複類型
type RecurrenceType = 
  | "none" 
  | "daily" 
  | "weekly" 
  | "biweekly" 
  | "monthly" 
  | "bimonthly" 
  | "quarterly" 
  | "semiannually" 
  | "yearly" 
  | "custom"

// 重複類型選項
const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "不重複" },
  { value: "daily", label: "每日" },
  { value: "weekly", label: "每週" },
  { value: "biweekly", label: "每兩週" },
  { value: "monthly", label: "每月" },
  { value: "bimonthly", label: "每雙月" },
  { value: "quarterly", label: "每季" },
  { value: "semiannually", label: "每半年" },
  { value: "yearly", label: "每年" },
  { value: "custom", label: "自訂天數" },
]

// 四象限配置
const QUADRANTS: {
  key: Quadrant
  title: string
  subtitle: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ElementType
  is_important: boolean
  is_urgent: boolean
}[] = [
  {
    key: "do_first",
    title: "立即執行",
    subtitle: "重要且緊急",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: Flame,
    is_important: true,
    is_urgent: true,
  },
  {
    key: "schedule",
    title: "計劃安排",
    subtitle: "重要不緊急",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: CalendarDays,
    is_important: true,
    is_urgent: false,
  },
  {
    key: "delegate",
    title: "委託他人",
    subtitle: "緊急不重要",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Timer,
    is_important: false,
    is_urgent: true,
  },
  {
    key: "eliminate",
    title: "考慮刪除",
    subtitle: "不重要不緊急",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: Coffee,
    is_important: false,
    is_urgent: false,
  },
]

// 計算下一個任務日期
function calculateNextDueDate(
  currentDueDate: string | null,
  recurrenceType: RecurrenceType,
  customInterval?: number | null
): string {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date()
  const nextDate = new Date(baseDate)

  switch (recurrenceType) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + 14)
      break
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case "bimonthly":
      nextDate.setMonth(nextDate.getMonth() + 2)
      break
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case "semiannually":
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case "custom":
      if (customInterval && customInterval > 0) {
        nextDate.setDate(nextDate.getDate() + customInterval)
      }
      break
  }

  return nextDate.toISOString().split("T")[0]
}

// 取得重複類型標籤
function getRecurrenceLabel(type: string | null | undefined, interval?: number | null): string {
  if (!type || type === "none") return ""
  
  const option = RECURRENCE_OPTIONS.find(o => o.value === type)
  if (type === "custom" && interval) {
    return `每 ${interval} 天`
  }
  return option?.label || ""
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRecurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("pending")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRecurrence | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_important: false,
    is_urgent: false,
    due_date: "",
    recurrence_type: "none" as RecurrenceType,
    recurrence_interval: "",
    recurrence_end_date: "",
  })
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTask, setDeletingTask] = useState<TaskWithRecurrence | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入任務
  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true })

    if (data) {
      setTasks(data as TaskWithRecurrence[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // 取得象限任務
  const getQuadrantTasks = (quadrant: Quadrant) => {
    const config = QUADRANTS.find(q => q.key === quadrant)!
    return tasks.filter(task => {
      const matchQuadrant = 
        (task.is_important ?? false) === config.is_important &&
        (task.is_urgent ?? false) === config.is_urgent
      
      if (filter === "all") return matchQuadrant
      if (filter === "pending") return matchQuadrant && !task.completed_at
      if (filter === "completed") return matchQuadrant && !!task.completed_at
      return matchQuadrant
    })
  }

  // 開啟新增表單
  const openCreateForm = (quadrant?: Quadrant) => {
    setEditingTask(null)
    if (quadrant) {
      const config = QUADRANTS.find(q => q.key === quadrant)!
      setFormData({
        title: "",
        description: "",
        is_important: config.is_important,
        is_urgent: config.is_urgent,
        due_date: "",
        recurrence_type: "none",
        recurrence_interval: "",
        recurrence_end_date: "",
      })
    } else {
      setFormData({
        title: "",
        description: "",
        is_important: false,
        is_urgent: false,
        due_date: "",
        recurrence_type: "none",
        recurrence_interval: "",
        recurrence_end_date: "",
      })
    }
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (task: TaskWithRecurrence) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      is_important: task.is_important ?? false,
      is_urgent: task.is_urgent ?? false,
      due_date: task.due_date || "",
      recurrence_type: (task.recurrence_type as RecurrenceType) || "none",
      recurrence_interval: task.recurrence_interval?.toString() || "",
      recurrence_end_date: task.recurrence_end_date || "",
    })
    setFormOpen(true)
  }

  // 儲存任務
  const handleSave = async () => {
    if (!formData.title.trim()) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      is_important: formData.is_important,
      is_urgent: formData.is_urgent,
      due_date: formData.due_date || null,
      recurrence_type: formData.recurrence_type,
      recurrence_interval: formData.recurrence_type === "custom" && formData.recurrence_interval 
        ? parseInt(formData.recurrence_interval) 
        : null,
      recurrence_end_date: formData.recurrence_end_date || null,
    }

    if (editingTask) {
      await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", editingTask.id)
    } else {
      await supabase
        .from("tasks")
        .insert({
          ...taskData,
          user_id: user.id,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchTasks()
  }

  // 切換完成狀態（含例行任務處理）
  const toggleComplete = async (task: TaskWithRecurrence) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (task.completed_at) {
      // 取消完成
      await supabase
        .from("tasks")
        .update({ completed_at: null })
        .eq("id", task.id)
    } else {
      // 標記完成
      await supabase
        .from("tasks")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", task.id)

      // 如果是例行任務，自動產生下一個任務
      if (task.recurrence_type && task.recurrence_type !== "none") {
        const nextDueDate = calculateNextDueDate(
          task.due_date,
          task.recurrence_type as RecurrenceType,
          task.recurrence_interval
        )

        // 檢查是否超過結束日期
        const shouldCreate = !task.recurrence_end_date || 
          new Date(nextDueDate) <= new Date(task.recurrence_end_date)

        if (shouldCreate) {
          await supabase
            .from("tasks")
            .insert({
              user_id: user.id,
              title: task.title,
              description: task.description,
              is_important: task.is_important,
              is_urgent: task.is_urgent,
              due_date: nextDueDate,
              recurrence_type: task.recurrence_type,
              recurrence_interval: task.recurrence_interval,
              recurrence_end_date: task.recurrence_end_date,
              original_task_id: task.original_task_id || task.id,
            })
        }
      }
    }

    fetchTasks()
  }

  // 開啟刪除確認
  const openDeleteDialog = (task: TaskWithRecurrence) => {
    setDeletingTask(task)
    setDeleteDialogOpen(true)
  }

  // 刪除任務
  const handleDelete = async () => {
    if (!deletingTask) return

    setDeleteLoading(true)
    await supabase
      .from("tasks")
      .delete()
      .eq("id", deletingTask.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingTask(null)
    fetchTasks()
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "今天"
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "明天"
    }
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 檢查是否過期
  const isOverdue = (task: TaskWithRecurrence) => {
    if (!task.due_date || task.completed_at) return false
    return new Date(task.due_date) < new Date(new Date().toDateString())
  }

  // 統計
  const pendingCount = tasks.filter(t => !t.completed_at).length
  const completedToday = tasks.filter(t => {
    if (!t.completed_at) return false
    return new Date(t.completed_at).toDateString() === new Date().toDateString()
  }).length
  const recurringCount = tasks.filter(t => t.recurrence_type && t.recurrence_type !== "none" && !t.completed_at).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">任務管理</h1>
          <p className="text-gray-600 mt-1">
            使用四象限法則，聚焦重要任務
          </p>
        </div>
        <Button
          onClick={() => openCreateForm()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增任務
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
                <p className="text-xs text-gray-500">全部任務</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
                <p className="text-xs text-gray-500">待完成</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{completedToday}</p>
                <p className="text-xs text-gray-500">今日完成</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{recurringCount}</p>
                <p className="text-xs text-gray-500">例行任務</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 篩選 */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          全部
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          待完成
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          已完成
        </Button>
      </div>

      {/* 四象限視圖 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((quadrant) => {
          const Icon = quadrant.icon
          const quadrantTasks = getQuadrantTasks(quadrant.key)

          return (
            <Card
              key={quadrant.key}
              className={`${quadrant.borderColor} border-2`}
            >
              <CardHeader className={`${quadrant.bgColor} pb-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${quadrant.color}`} />
                    <div>
                      <CardTitle className={`text-base ${quadrant.color}`}>
                        {quadrant.title}
                      </CardTitle>
                      <p className="text-xs text-gray-500">{quadrant.subtitle}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={quadrant.color}
                    onClick={() => openCreateForm(quadrant.key)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 min-h-[200px]">
                {quadrantTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[150px] text-gray-400">
                    <p className="text-sm">沒有任務</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quadrantTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isOverdue={isOverdue(task)}
                        formatDate={formatDate}
                        onToggleComplete={() => toggleComplete(task)}
                        onEdit={() => openEditForm(task)}
                        onDelete={() => openDeleteDialog(task)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "編輯任務" : "新增任務"}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? "修改任務內容" : "設定任務的重要性和緊急性"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">任務名稱 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="輸入任務名稱"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="選填，補充說明"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">截止日期</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            {/* 重複設定 */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-medium">重複設定</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recurrence_type" className="text-xs text-gray-500">重複週期</Label>
                <Select
                  value={formData.recurrence_type}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    recurrence_type: value as RecurrenceType,
                    recurrence_interval: value !== "custom" ? "" : formData.recurrence_interval
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇重複週期" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 自訂天數 */}
              {formData.recurrence_type === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence_interval" className="text-xs text-gray-500">
                    每幾天重複
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">每</span>
                    <Input
                      id="recurrence_interval"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                      placeholder="天數"
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                </div>
              )}

              {/* 結束日期 */}
              {formData.recurrence_type !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence_end_date" className="text-xs text-gray-500">
                    結束日期（選填）
                  </Label>
                  <Input
                    id="recurrence_end_date"
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                  />
                  <p className="text-xs text-gray-400">
                    不填則會一直重複
                  </p>
                </div>
              )}
            </div>

            {/* 重要性/緊急性 */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.is_important
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setFormData({ ...formData, is_important: !formData.is_important })}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.is_important}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_important: !!checked })
                    }
                  />
                  <div>
                    <p className="font-medium text-sm">重要</p>
                    <p className="text-xs text-gray-500">對目標有重大影響</p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.is_urgent
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setFormData({ ...formData, is_urgent: !formData.is_urgent })}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.is_urgent}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_urgent: !!checked })
                    }
                  />
                  <div>
                    <p className="font-medium text-sm">緊急</p>
                    <p className="text-xs text-gray-500">需要立即處理</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 象限預覽 */}
            <div className="pt-2">
              <p className="text-sm text-gray-500">
                此任務將歸類到：
                <span className="font-medium ml-1">
                  {formData.is_important && formData.is_urgent && "🔥 立即執行"}
                  {formData.is_important && !formData.is_urgent && "📅 計劃安排"}
                  {!formData.is_important && formData.is_urgent && "⏱️ 委託他人"}
                  {!formData.is_important && !formData.is_urgent && "☕ 考慮刪除"}
                </span>
              </p>
              {formData.recurrence_type !== "none" && (
                <p className="text-sm text-purple-600 mt-1">
                  🔄 {getRecurrenceLabel(formData.recurrence_type, parseInt(formData.recurrence_interval) || undefined)}
                  {formData.recurrence_end_date && ` (至 ${formData.recurrence_end_date})`}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title.trim() || saving || (formData.recurrence_type === "custom" && !formData.recurrence_interval)}
              className="bg-blue-600 hover:bg-blue-700"
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
              刪除「{deletingTask?.title}」後無法復原。
              {deletingTask?.recurrence_type && deletingTask.recurrence_type !== "none" && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ 這是例行任務，刪除後不會再自動產生。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
            >
              {deleteLoading ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 任務卡片元件
function TaskCard({
  task,
  isOverdue,
  formatDate,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  task: TaskWithRecurrence
  isOverdue: boolean
  formatDate: (date: string) => string
  onToggleComplete: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isCompleted = !!task.completed_at
  const isRecurring = task.recurrence_type && task.recurrence_type !== "none"

  return (
    <div
      className={`group p-3 rounded-lg border transition-all ${
        isCompleted
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 完成按鈕 */}
        <button
          onClick={onToggleComplete}
          className="mt-0.5 shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300 hover:text-blue-500 transition-colors" />
          )}
        </button>

        {/* 內容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm ${
                isCompleted ? "text-gray-400 line-through" : "text-gray-800"
              }`}
            >
              {task.title}
            </p>
            {isRecurring && (
            <span title={getRecurrenceLabel(task.recurrence_type, task.recurrence_interval)}>
              <Repeat className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            </span>            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <CalendarDays className={`w-3 h-3 ${isOverdue ? "text-red-500" : "text-gray-400"}`} />
                <span
                  className={`text-xs ${
                    isOverdue ? "text-red-500 font-medium" : "text-gray-500"
                  }`}
                >
                  {isOverdue ? "已過期 · " : ""}
                  {formatDate(task.due_date)}
                </span>
              </div>
            )}
            {isRecurring && (
              <span className="text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">
                {getRecurrenceLabel(task.recurrence_type, task.recurrence_interval)}
              </span>
            )}
          </div>
        </div>

        {/* 選單 */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-20 w-28 bg-white rounded-md shadow-lg border py-1">
                <button
                  className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowMenu(false)
                    onEdit()
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  編輯
                </button>
                <button
                  className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setShowMenu(false)
                    onDelete()
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  刪除
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
