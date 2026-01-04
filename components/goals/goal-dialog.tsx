// components/goals/goal-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, TrendingUp, TrendingDown, Flame, Target, Link2, Clock, Repeat } from "lucide-react"
import type { Goal } from "./goal-card"
import { TRACK_SOURCE_OPTIONS, type TrackConfig } from "@/lib/hooks/use-goal-progress"

// 目標類型選項
const GOAL_TYPES = [
  { value: "countdown", label: "倒數計時", icon: Calendar, description: "距離某個日期的倒數" },
  { value: "numeric", label: "數值目標", icon: TrendingUp, description: "達成特定數值" },
  { value: "streak", label: "連續天數", icon: Flame, description: "連續完成某件事" },
  { value: "count", label: "累計次數", icon: Target, description: "累計達成次數" },
]

// 顏色選項
const COLORS = [
  { value: "blue", label: "藍色", class: "bg-blue-500" },
  { value: "red", label: "紅色", class: "bg-red-500" },
  { value: "green", label: "綠色", class: "bg-green-500" },
  { value: "amber", label: "琥珀", class: "bg-amber-500" },
  { value: "purple", label: "紫色", class: "bg-purple-500" },
  { value: "pink", label: "粉紅", class: "bg-pink-500" },
  { value: "indigo", label: "靛藍", class: "bg-indigo-500" },
  { value: "cyan", label: "青色", class: "bg-cyan-500" },
]

// 常用圖示
const ICONS = ["🎯", "📚", "💪", "🏃", "💰", "📝", "🎓", "❤️", "🌟", "🔥", "✅", "📅", "🎉", "🏆", "💡", "🌱"]

// 習慣選項（從 props 傳入）
interface Habit {
  id: string
  name: string
  icon: string
}

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (goalData: Partial<Goal>) => void
  saving: boolean
  editGoal?: Goal | null
  habits?: Habit[]  // 可選的習慣列表
}

export function GoalDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  saving,
  editGoal,
  habits = [],
}: GoalDialogProps) {
  const isEdit = !!editGoal

  // 表單狀態
  const [goalType, setGoalType] = useState<string>(editGoal?.goal_type || "countdown")
  const [title, setTitle] = useState(editGoal?.title || "")
  const [description, setDescription] = useState(editGoal?.description || "")
  const [icon, setIcon] = useState(editGoal?.icon || "🎯")
  const [color, setColor] = useState(editGoal?.color || "blue")
  
  // 倒數型
  const [targetDate, setTargetDate] = useState(editGoal?.target_date || "")
  
  // 數值型
  const [startValue, setStartValue] = useState(editGoal?.start_value?.toString() || "")
  const [targetValue, setTargetValue] = useState(editGoal?.target_value?.toString() || "")
  const [currentValue, setCurrentValue] = useState(editGoal?.current_value?.toString() || "")
  const [unit, setUnit] = useState(editGoal?.unit || "")
  const [direction, setDirection] = useState<"increase" | "decrease">(editGoal?.direction || "increase")
  
  // 連續/累計型
  const [targetCount, setTargetCount] = useState(editGoal?.target_count?.toString() || "")

  // 週期設定
  const [periodType, setPeriodType] = useState<"once" | "monthly" | "yearly">(editGoal?.period_type || "once")
  const [periodTarget, setPeriodTarget] = useState(editGoal?.period_target?.toString() || "")
  const [deadline, setDeadline] = useState(editGoal?.deadline || "")

  // 追蹤來源
  const [trackSource, setTrackSource] = useState(editGoal?.track_source || "manual")
  const [selectedHabitId, setSelectedHabitId] = useState<string>(
    (editGoal?.track_config as TrackConfig)?.habit_id || ""
  )
  const [trackTargetValue, setTrackTargetValue] = useState<string>(
    (editGoal?.track_config as TrackConfig)?.target_value?.toString() || ""
  )

  // 根據目標類型過濾可用的追蹤來源
  const availableTrackSources = TRACK_SOURCE_OPTIONS.filter(
    opt => opt.goalTypes.includes(goalType)
  )

  // 重置表單
  const resetForm = () => {
    setGoalType("countdown")
    setTitle("")
    setDescription("")
    setIcon("🎯")
    setColor("blue")
    setTargetDate("")
    setStartValue("")
    setTargetValue("")
    setCurrentValue("")
    setUnit("")
    setDirection("increase")
    setTargetCount("")
    setPeriodType("once")
    setPeriodTarget("")
    setDeadline("")
    setTrackSource("manual")
    setSelectedHabitId("")
    setTrackTargetValue("")
  }

  // 當 editGoal 變更時更新表單
  useEffect(() => {
    if (editGoal) {
      setGoalType(editGoal.goal_type)
      setTitle(editGoal.title)
      setDescription(editGoal.description || "")
      setIcon(editGoal.icon)
      setColor(editGoal.color)
      setTargetDate(editGoal.target_date || "")
      setStartValue(editGoal.start_value?.toString() || "")
      setTargetValue(editGoal.target_value?.toString() || "")
      setCurrentValue(editGoal.current_value?.toString() || "")
      setUnit(editGoal.unit || "")
      setDirection(editGoal.direction || "increase")
      setTargetCount(editGoal.target_count?.toString() || "")
      setPeriodType(editGoal.period_type || "once")
      setPeriodTarget(editGoal.period_target?.toString() || "")
      setDeadline(editGoal.deadline || "")
      setTrackSource(editGoal.track_source || "manual")
      const config = editGoal.track_config as TrackConfig
      setSelectedHabitId(config?.habit_id || "")
      setTrackTargetValue(config?.target_value?.toString() || "")
    } else {
      resetForm()
    }
  }, [editGoal])

  // 當目標類型改變時，重置追蹤來源
  useEffect(() => {
    const available = TRACK_SOURCE_OPTIONS.filter(opt => opt.goalTypes.includes(goalType))
    if (!available.find(opt => opt.value === trackSource)) {
      setTrackSource("manual")
    }
  }, [goalType, trackSource])

  // 處理儲存
  const handleSave = () => {
    // 建立追蹤設定
    const trackConfig: TrackConfig = {}
    if (trackSource === "habit" && selectedHabitId) {
      trackConfig.habit_id = selectedHabitId
    }
    if ((trackSource === "water_days" || trackSource === "sleep_days") && trackTargetValue) {
      trackConfig.target_value = parseFloat(trackTargetValue)
    }
    trackConfig.start_date = format(new Date(), "yyyy-MM-dd")

    const goalData: Partial<Goal> = {
      title,
      description: description || null,
      icon,
      color,
      goal_type: goalType as Goal["goal_type"],
      track_source: trackSource,
      track_config: Object.keys(trackConfig).length > 0 ? (trackConfig as Goal["track_config"]) : null,
      period_type: periodType,
      period_target: periodTarget ? parseFloat(periodTarget) : null,
      deadline: deadline || null,
    }

    switch (goalType) {
      case "countdown":
        goalData.target_date = targetDate || null
        goalData.period_type = "once"  // 倒數型強制為單次
        break
      case "numeric":
        goalData.start_value = startValue ? parseFloat(startValue) : null
        goalData.target_value = targetValue ? parseFloat(targetValue) : null
        goalData.current_value = trackSource === "manual" 
          ? (currentValue ? parseFloat(currentValue) : (startValue ? parseFloat(startValue) : null))
          : null  // 自動追蹤的由系統計算
        goalData.unit = unit || null
        goalData.direction = direction
        break
      case "streak":
        goalData.target_count = targetCount ? parseInt(targetCount) : null
        goalData.current_count = trackSource === "manual" ? (editGoal?.current_count || 0) : 0
        goalData.period_type = "once"  // 連續型強制為單次
        break
      case "count":
        goalData.target_count = targetCount ? parseInt(targetCount) : null
        goalData.current_count = trackSource === "manual" ? (editGoal?.current_count || 0) : 0
        goalData.unit = unit || "次"
        break
    }

    if (isEdit && editGoal) {
      goalData.id = editGoal.id
    }

    onSave(goalData)
  }

  // 驗證表單
  const isValid = () => {
    if (!title.trim()) return false
    
    switch (goalType) {
      case "countdown":
        return !!targetDate
      case "numeric":
        return !!targetValue
      case "streak":
      case "count":
        return !!targetCount && parseInt(targetCount) > 0
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯目標" : "新增目標"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改目標設定" : "設定一個新的目標來追蹤進度"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 目標類型（新增時才能選） */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>目標類型 *</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setGoalType(type.value)}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${goalType === type.value 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 標題 */}
          <div className="space-y-2">
            <Label>目標名稱 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                goalType === "countdown" ? "例：期末考" :
                goalType === "numeric" ? "例：減重到 65kg" :
                goalType === "streak" ? "例：連續寫日誌 30 天" :
                "例：讀完 10 本書"
              }
            />
          </div>

          {/* 圖示與顏色 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>圖示</Label>
              <div className="flex flex-wrap gap-1">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`
                      w-8 h-8 text-lg rounded border transition-all
                      ${icon === i ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                    `}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>顏色</Label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`
                      w-8 h-8 rounded-full transition-all
                      ${c.class}
                      ${color === c.value ? "ring-2 ring-offset-2 ring-blue-500" : ""}
                    `}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 追蹤來源（非倒數型才顯示） */}
          {goalType !== "countdown" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                資料來源
              </Label>
              <Select value={trackSource} onValueChange={setTrackSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTrackSources.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 習慣選擇 */}
              {trackSource === "habit" && habits.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm">選擇習慣</Label>
                  <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇要追蹤的習慣" />
                    </SelectTrigger>
                    <SelectContent>
                      {habits.map((habit) => (
                        <SelectItem key={habit.id} value={habit.id}>
                          {habit.icon} {habit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 飲水/睡眠達標值 */}
              {(trackSource === "water_days" || trackSource === "sleep_days") && (
                <div className="mt-2">
                  <Label className="text-sm">
                    {trackSource === "water_days" ? "每日飲水目標 (ml)" : "每日睡眠目標 (小時)"}
                  </Label>
                  <Input
                    type="number"
                    value={trackTargetValue}
                    onChange={(e) => setTrackTargetValue(e.target.value)}
                    placeholder={trackSource === "water_days" ? "2000" : "7"}
                  />
                </div>
              )}

              {trackSource !== "manual" && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 系統會自動從「{availableTrackSources.find(s => s.value === trackSource)?.label}」計算進度
                </p>
              )}
            </div>
          )}

          {/* 根據目標類型顯示不同欄位 */}
          {goalType === "countdown" && (
            <div className="space-y-2">
              <Label>目標日期 *</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          )}

          {goalType === "numeric" && (
            <>
              <div className="space-y-2">
                <Label>方向</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as "increase" | "decrease")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> 增加
                      </span>
                    </SelectItem>
                    <SelectItem value="decrease">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> 減少
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>起始值</Label>
                  <Input
                    type="number"
                    value={startValue}
                    onChange={(e) => setStartValue(e.target.value)}
                    placeholder="例：80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>目標值 *</Label>
                  <Input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="例：65"
                  />
                </div>
              </div>
              {isEdit && (
                <div className="space-y-2">
                  <Label>目前值</Label>
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="目前的數值"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>單位</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="例：kg, 元, 分"
                />
              </div>
            </>
          )}

          {(goalType === "streak" || goalType === "count") && (
            <>
              <div className="space-y-2">
                <Label>
                  {goalType === "streak" ? "目標天數 *" : "目標次數 *"}
                </Label>
                <Input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder={goalType === "streak" ? "例：30" : "例：10"}
                  min="1"
                />
              </div>
              {goalType === "count" && (
                <div className="space-y-2">
                  <Label>單位</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="例：本、次、篇"
                  />
                </div>
              )}
            </>
          )}

          {/* 週期設定（非倒數和連續型） */}
          {(goalType === "numeric" || goalType === "count") && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <Label className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                週期設定
              </Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as "once" | "monthly" | "yearly")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">單次目標</SelectItem>
                  <SelectItem value="monthly">每月重複</SelectItem>
                  <SelectItem value="yearly">每年重複</SelectItem>
                </SelectContent>
              </Select>
              
              {periodType !== "once" && (
                <div className="space-y-2 mt-2">
                  <Label className="text-sm">
                    {periodType === "monthly" ? "每月目標" : "每年目標"}
                    {goalType === "numeric" && unit ? ` (${unit})` : ""}
                    {goalType === "count" ? ` (${unit || "次"})` : ""}
                  </Label>
                  <Input
                    type="number"
                    value={periodTarget}
                    onChange={(e) => setPeriodTarget(e.target.value)}
                    placeholder={
                      goalType === "numeric" 
                        ? (periodType === "monthly" ? "例：每月減 1" : "例：每年存 60000")
                        : (periodType === "monthly" ? "例：每月 20 次" : "例：每年 100 次")
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {periodType === "monthly" 
                      ? "系統會每月自動計算當月進度" 
                      : "系統會每年自動計算當年進度"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 截止日期（非倒數型） */}
          {goalType !== "countdown" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                截止日期（選填）
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
              <p className="text-xs text-gray-500">
                設定截止日期後，卡片會顯示剩餘天數提醒
              </p>
            </div>
          )}

          {/* 描述 */}
          <div className="space-y-2">
            <Label>描述（選填）</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="補充說明..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid()}>
            {saving ? "儲存中..." : isEdit ? "更新" : "建立目標"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 更新進度對話框
interface UpdateProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  onSave: (goalId: string, value: number) => void
  saving: boolean
}

export function UpdateProgressDialog({
  open,
  onOpenChange,
  goal,
  onSave,
  saving,
}: UpdateProgressDialogProps) {
  const [value, setValue] = useState("")

  if (!goal) return null

  const handleSave = () => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      onSave(goal.id, numValue)
      setValue("")
    }
  }

  const getLabel = () => {
    switch (goal.goal_type) {
      case "numeric":
        return `目前數值（${goal.unit || ""}）`
      case "streak":
        return "目前連續天數"
      case "count":
        return `目前次數（${goal.unit || "次"}）`
      default:
        return "數值"
    }
  }

  const getCurrentValue = () => {
    switch (goal.goal_type) {
      case "numeric":
        return goal.current_value?.toString() || ""
      case "streak":
      case "count":
        return goal.current_count?.toString() || "0"
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>更新進度</DialogTitle>
          <DialogDescription>
            {goal.icon} {goal.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center text-sm text-gray-500 mb-2">
            目前：{getCurrentValue()} {goal.unit || ""}
          </div>
          <div className="space-y-2">
            <Label>{getLabel()}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="輸入新的數值"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !value}>
            {saving ? "更新中..." : "更新"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
