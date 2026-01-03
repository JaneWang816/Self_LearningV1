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
import { Calendar, TrendingUp, TrendingDown, Flame, Target } from "lucide-react"
import type { Goal } from "./goal-card"

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

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (goalData: Partial<Goal>) => void
  saving: boolean
  editGoal?: Goal | null
}

export function GoalDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  saving,
  editGoal 
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
    } else {
      resetForm()
    }
  }, [editGoal])

  // 處理儲存
  const handleSave = () => {
    const goalData: Partial<Goal> = {
      title,
      description: description || null,
      icon,
      color,
      goal_type: goalType as Goal["goal_type"],
      track_source: "manual",
    }

    switch (goalType) {
      case "countdown":
        goalData.target_date = targetDate || null
        break
      case "numeric":
        goalData.start_value = startValue ? parseFloat(startValue) : null
        goalData.target_value = targetValue ? parseFloat(targetValue) : null
        goalData.current_value = currentValue ? parseFloat(currentValue) : (startValue ? parseFloat(startValue) : null)
        goalData.unit = unit || null
        goalData.direction = direction
        break
      case "streak":
      case "count":
        goalData.target_count = targetCount ? parseInt(targetCount) : null
        goalData.current_count = editGoal?.current_count || 0
        goalData.unit = goalType === "count" ? (unit || "次") : null
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
