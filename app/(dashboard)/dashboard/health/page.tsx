// app/(dashboard)/dashboard/health/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dumbbell,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Flame,
  Scale,
  Heart,
  Moon,
  Droplets,
  Activity,
  Footprints,
} from "lucide-react"
import {
  EXERCISE_TYPES,
} from "@/types/custom"
import type { HealthExercise, HealthMetric } from "@/types/custom"

// 健康數值類型對照（本地定義，包含新的 steps）
const METRIC_TYPE_LABELS: Record<string, string> = {
  weight: '體重 (kg)',
  blood_pressure: '血壓',
  sleep: '睡眠 (小時)',
  water: '飲水 (ml)',
  steps: '步數',
}

// 運動類型圖示
const exerciseIcons: Record<string, string> = {
  跑步: "🏃",
  游泳: "🏊",
  籃球: "🏀",
  羽球: "🏸",
  桌球: "🏓",
  健身: "💪",
  瑜珈: "🧘",
  騎車: "🚴",
  走路: "🚶",
  其他: "⚡",
}

// 健康數值圖示
const metricIcons: Record<string, React.ElementType> = {
  weight: Scale,
  blood_pressure: Heart,
  sleep: Moon,
  water: Droplets,
  steps: Footprints,
}

// 擴展 HealthMetric 類型（加入 value_tertiary）
type HealthMetricExtended = HealthMetric & {
  value_tertiary?: number | null
}

export default function HealthPage() {
  const [exercises, setExercises] = useState<HealthExercise[]>([])
  const [metrics, setMetrics] = useState<HealthMetricExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("exercise")

  // 運動表單狀態
  const [exerciseFormOpen, setExerciseFormOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<HealthExercise | null>(null)
  const [exerciseType, setExerciseType] = useState("")
  const [exerciseDuration, setExerciseDuration] = useState<number | null>(null)
  const [exerciseDistance, setExerciseDistance] = useState<number | null>(null)
  const [exerciseCalories, setExerciseCalories] = useState<number | null>(null)
  const [exerciseNote, setExerciseNote] = useState("")
  const [exerciseDate, setExerciseDate] = useState(new Date().toISOString().split("T")[0])

  // 健康數值表單狀態
  const [metricFormOpen, setMetricFormOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<HealthMetricExtended | null>(null)
  const [metricType, setMetricType] = useState<string>("weight")
  const [metricValuePrimary, setMetricValuePrimary] = useState<number | null>(null)
  const [metricValueSecondary, setMetricValueSecondary] = useState<number | null>(null)
  const [metricValueTertiary, setMetricValueTertiary] = useState<number | null>(null) // 脈搏
  const [metricNote, setMetricNote] = useState("")
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split("T")[0])

  // 共用狀態
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: "exercise" | "metric"; item: HealthExercise | HealthMetricExtended } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [exercisesRes, metricsRes] = await Promise.all([
      supabase
        .from("health_exercises")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
    ])

    if (exercisesRes.data) setExercises(exercisesRes.data)
    if (metricsRes.data) setMetrics(metricsRes.data as HealthMetricExtended[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ============ 運動記錄 ============

  const openExerciseCreateForm = () => {
    setEditingExercise(null)
    setExerciseType("")
    setExerciseDuration(null)
    setExerciseDistance(null)
    setExerciseCalories(null)
    setExerciseNote("")
    setExerciseDate(new Date().toISOString().split("T")[0])
    setExerciseFormOpen(true)
  }

  const openExerciseEditForm = (exercise: HealthExercise) => {
    setEditingExercise(exercise)
    setExerciseType(exercise.exercise_type)
    setExerciseDuration(exercise.duration_minutes)
    setExerciseDistance(exercise.distance_km ? Number(exercise.distance_km) : null)
    setExerciseCalories(exercise.calories)
    setExerciseNote(exercise.note || "")
    setExerciseDate(exercise.date)
    setExerciseFormOpen(true)
  }

  const handleExerciseSave = async () => {
    if (!exerciseType) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const exerciseData = {
      exercise_type: exerciseType,
      duration_minutes: exerciseDuration,
      distance_km: exerciseDistance,
      calories: exerciseCalories,
      note: exerciseNote.trim() || null,
      date: exerciseDate,
    }

    if (editingExercise) {
      await supabase
        .from("health_exercises")
        .update(exerciseData)
        .eq("id", editingExercise.id)
    } else {
      await supabase
        .from("health_exercises")
        .insert({
          ...exerciseData,
          user_id: user.id,
        })
    }

    setSaving(false)
    setExerciseFormOpen(false)
    fetchData()
  }

  // ============ 健康數值 ============

  const openMetricCreateForm = (type?: string) => {
    setEditingMetric(null)
    setMetricType(type || "weight")
    setMetricValuePrimary(null)
    setMetricValueSecondary(null)
    setMetricValueTertiary(null)
    setMetricNote("")
    setMetricDate(new Date().toISOString().split("T")[0])
    setMetricFormOpen(true)
  }

  const openMetricEditForm = (metric: HealthMetricExtended) => {
    setEditingMetric(metric)
    setMetricType(metric.metric_type)
    setMetricValuePrimary(Number(metric.value_primary))
    setMetricValueSecondary(metric.value_secondary ? Number(metric.value_secondary) : null)
    setMetricValueTertiary(metric.value_tertiary ? Number(metric.value_tertiary) : null)
    setMetricNote(metric.note || "")
    setMetricDate(metric.date)
    setMetricFormOpen(true)
  }

  const handleMetricSave = async () => {
    if (!metricValuePrimary) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    if (editingMetric) {
      await supabase
        .from("health_metrics")
        .update({
          metric_type: metricType,
          value_primary: metricValuePrimary!,
          value_secondary: metricValueSecondary,
          value_tertiary: metricType === "blood_pressure" ? metricValueTertiary : null,
          note: metricNote.trim() || null,
          date: metricDate,
        })
        .eq("id", editingMetric.id)
    } else {
      await supabase
        .from("health_metrics")
        .insert({
          user_id: user.id,
          metric_type: metricType,
          value_primary: metricValuePrimary!,
          value_secondary: metricValueSecondary,
          value_tertiary: metricType === "blood_pressure" ? metricValueTertiary : null,
          note: metricNote.trim() || null,
          date: metricDate,
        })
    }

    setSaving(false)
    setMetricFormOpen(false)
    fetchData()
  }

  // ============ 刪除 ============

  const openDeleteDialog = (type: "exercise" | "metric", item: HealthExercise | HealthMetricExtended) => {
    setDeletingItem({ type, item })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setDeleteLoading(true)

    const table = deletingItem.type === "exercise" ? "health_exercises" : "health_metrics"
    await supabase.from(table).delete().eq("id", deletingItem.item.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingItem(null)
    fetchData()
  }

  // ============ 輔助函數 ============

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
      weekday: "short",
    })
  }

  const getMetricLabel = (type: string) => {
    switch (type) {
      case "weight": return "體重"
      case "blood_pressure": return "血壓"
      case "sleep": return "睡眠"
      case "water": return "飲水"
      case "steps": return "步數"
      default: return type
    }
  }

  const formatMetricValue = (metric: HealthMetricExtended) => {
    switch (metric.metric_type) {
      case "weight":
        return `${metric.value_primary} kg`
      case "blood_pressure":
        const bp = `${metric.value_primary}/${metric.value_secondary || "-"} mmHg`
        const pulse = metric.value_tertiary ? ` · ${metric.value_tertiary} bpm` : ""
        return bp + pulse
      case "sleep":
        return `${metric.value_primary} 小時`
      case "water":
        return `${metric.value_primary} ml`
      case "steps":
        return `${metric.value_primary.toLocaleString()} 步`
      default:
        return `${metric.value_primary}`
    }
  }

  // 統計
  const thisWeekExercises = exercises.filter((e) => {
    const date = new Date(e.date)
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    return date >= weekAgo
  })

  const totalDuration = thisWeekExercises.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const totalCalories = thisWeekExercises.reduce((sum, e) => sum + (e.calories || 0), 0)

  // 今日步數
  const todaySteps = metrics.find(
    (m) => m.metric_type === "steps" && m.date === new Date().toISOString().split("T")[0]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">健康記錄</h1>
          <p className="text-gray-600 mt-1">追蹤運動與健康數據</p>
        </div>
      </div>

      {/* 本週統計 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{thisWeekExercises.length}</p>
            <p className="text-sm text-gray-500">本週運動次數</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{totalDuration}</p>
            <p className="text-sm text-gray-500">總時長（分鐘）</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{totalCalories}</p>
            <p className="text-sm text-gray-500">消耗卡路里</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Footprints className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {todaySteps ? todaySteps.value_primary.toLocaleString() : "-"}
            </p>
            <p className="text-sm text-gray-500">今日步數</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Dumbbell className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{exercises.length}</p>
            <p className="text-sm text-gray-500">總運動記錄</p>
          </CardContent>
        </Card>
      </div>

      {/* 分頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="exercise" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              運動記錄
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <Activity className="w-4 h-4" />
              健康數值
            </TabsTrigger>
          </TabsList>

          {activeTab === "exercise" ? (
            <Button onClick={openExerciseCreateForm} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              新增運動
            </Button>
          ) : (
            <Button onClick={() => openMetricCreateForm()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新增記錄
            </Button>
          )}
        </div>

        {/* 運動記錄 */}
        <TabsContent value="exercise" className="space-y-4 mt-4">
          {exercises.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">尚無運動記錄</h3>
                <p className="text-gray-600 text-center mb-4">開始記錄你的運動吧！</p>
                <Button onClick={openExerciseCreateForm} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新增運動
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={() => openExerciseEditForm(exercise)}
                  onDelete={() => openDeleteDialog("exercise", exercise)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 健康數值 */}
        <TabsContent value="metrics" className="space-y-4 mt-4">
          {/* 快速新增按鈕 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(METRIC_TYPE_LABELS).map(([type, label]) => {
              const Icon = metricIcons[type] || Activity
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => openMetricCreateForm(type)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{label.split(" ")[0]}</span>
                </Button>
              )
            })}
          </div>

          {metrics.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">尚無健康數值</h3>
                <p className="text-gray-600 text-center mb-4">開始記錄體重、睡眠等數據吧！</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  onEdit={() => openMetricEditForm(metric)}
                  onDelete={() => openDeleteDialog("metric", metric)}
                  formatDate={formatDate}
                  formatValue={formatMetricValue}
                  getLabel={getMetricLabel}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 運動表單 */}
      <Dialog open={exerciseFormOpen} onOpenChange={setExerciseFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExercise ? "編輯運動" : "新增運動記錄"}</DialogTitle>
            <DialogDescription>記錄你的運動內容</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>運動類型 *</Label>
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {exerciseIcons[type] || "⚡"} {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>日期</Label>
                <Input
                  type="date"
                  value={exerciseDate}
                  onChange={(e) => setExerciseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>時長（分鐘）</Label>
                <Input
                  type="number"
                  min="1"
                  value={exerciseDuration || ""}
                  onChange={(e) => setExerciseDuration(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>距離（公里）</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={exerciseDistance || ""}
                  onChange={(e) => setExerciseDistance(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="5.0"
                />
              </div>
              <div className="space-y-2">
                <Label>消耗卡路里</Label>
                <Input
                  type="number"
                  min="0"
                  value={exerciseCalories || ""}
                  onChange={(e) => setExerciseCalories(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                value={exerciseNote}
                onChange={(e) => setExerciseNote(e.target.value)}
                placeholder="記錄運動心得..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseFormOpen(false)}>取消</Button>
            <Button
              onClick={handleExerciseSave}
              disabled={!exerciseType || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 健康數值表單 */}
      <Dialog open={metricFormOpen} onOpenChange={setMetricFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMetric ? "編輯記錄" : "新增健康數值"}</DialogTitle>
            <DialogDescription>記錄你的健康數據</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>類型 *</Label>
                <Select value={metricType} onValueChange={setMetricType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METRIC_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>日期</Label>
                <Input
                  type="date"
                  value={metricDate}
                  onChange={(e) => setMetricDate(e.target.value)}
                />
              </div>
            </div>

            {/* 根據類型顯示不同輸入欄位 */}
            {metricType === "blood_pressure" ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>收縮壓 (mmHg) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={metricValuePrimary || ""}
                    onChange={(e) => setMetricValuePrimary(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label>舒張壓 (mmHg)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={metricValueSecondary || ""}
                    onChange={(e) => setMetricValueSecondary(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>脈搏 (bpm)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={metricValueTertiary || ""}
                    onChange={(e) => setMetricValueTertiary(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="72"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>
                  {metricType === "weight" && "體重 (kg) *"}
                  {metricType === "sleep" && "睡眠時數 *"}
                  {metricType === "water" && "飲水量 (ml) *"}
                  {metricType === "steps" && "步數 *"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={metricType === "weight" ? "0.1" : "1"}
                  value={metricValuePrimary || ""}
                  onChange={(e) => setMetricValuePrimary(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder={
                    metricType === "weight" ? "65.5" : 
                    metricType === "sleep" ? "7" : 
                    metricType === "water" ? "2000" :
                    metricType === "steps" ? "10000" : ""
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                value={metricNote}
                onChange={(e) => setMetricNote(e.target.value)}
                placeholder="備註..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricFormOpen(false)}>取消</Button>
            <Button
              onClick={handleMetricSave}
              disabled={!metricValuePrimary || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>刪除後無法復原。</AlertDialogDescription>
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

// 運動卡片
function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
  formatDate,
}: {
  exercise: HealthExercise
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const icon = exerciseIcons[exercise.exercise_type] || "⚡"

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{exercise.exercise_type}</h3>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(exercise.date)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {exercise.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {exercise.duration_minutes} 分鐘
                </span>
              )}
              {exercise.distance_km && (
                <span>{exercise.distance_km} km</span>
              )}
              {exercise.calories && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {exercise.calories} kcal
                </span>
              )}
            </div>
            {exercise.note && (
              <p className="text-sm text-gray-500 mt-1">{exercise.note}</p>
            )}
          </div>

          <div className="relative shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-md shadow-lg border py-1">
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => { setShowMenu(false); onEdit(); }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />編輯
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => { setShowMenu(false); onDelete(); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />刪除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 健康數值卡片
function MetricCard({
  metric,
  onEdit,
  onDelete,
  formatDate,
  formatValue,
  getLabel,
}: {
  metric: HealthMetricExtended
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  formatValue: (metric: HealthMetricExtended) => string
  getLabel: (type: string) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const Icon = metricIcons[metric.metric_type] || Activity

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                {getLabel(metric.metric_type)}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(metric.date)}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatValue(metric)}</p>
            {metric.note && (
              <p className="text-sm text-gray-500 mt-1">{metric.note}</p>
            )}
          </div>

          <div className="relative shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-md shadow-lg border py-1">
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => { setShowMenu(false); onEdit(); }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />編輯
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => { setShowMenu(false); onDelete(); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />刪除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
