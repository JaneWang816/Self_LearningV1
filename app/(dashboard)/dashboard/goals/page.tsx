// app/(dashboard)/dashboard/goals/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { GoalCard, type Goal } from "@/components/goals/goal-card"
import { GoalDialog, UpdateProgressDialog } from "@/components/goals/goal-dialog"
import { Plus, ArrowLeft, Target } from "lucide-react"

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 對話框狀態
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  // 篩選狀態
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused">("all")

  // 載入目標
  const fetchGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    let query = supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    const { data, error } = await query

    if (!error && data) {
      setGoals(data as Goal[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // 篩選後的目標
  const filteredGoals = goals.filter(goal => {
    if (filter === "all") return goal.status !== "archived"
    return goal.status === filter
  })

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
        const { id, ...updateData } = goalData
        await supabase.from("goals").update(updateData).eq("id", id)
      } else {
        // 確保必填欄位存在
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
          track_source: goalData.track_source ?? "manual",
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

  // 更新狀態
  const handleUpdateStatus = async (goalId: string, status: Goal["status"]) => {
    try {
      const updateData: Partial<Goal> = { status }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      }
      await supabase.from("goals").update(updateData).eq("id", goalId)
      await fetchGoals()
    } catch (error) {
      console.error("更新狀態失敗:", error)
    }
  }

  // 刪除目標
  const handleDelete = async (goalId: string) => {
    if (!confirm("確定要刪除這個目標嗎？")) return

    try {
      await supabase.from("goals").delete().eq("id", goalId)
      await fetchGoals()
    } catch (error) {
      console.error("刪除目標失敗:", error)
    }
  }

  // 更新進度
  const handleUpdateProgress = async (goalId: string, value: number) => {
    setSaving(true)
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      let updateData: Partial<Goal> = {}
      
      if (goal.goal_type === "numeric") {
        updateData.current_value = value
        if (goal.direction === "decrease" && value <= (goal.target_value || 0)) {
          updateData.status = "completed"
          updateData.completed_at = new Date().toISOString()
        } else if (goal.direction === "increase" && value >= (goal.target_value || 0)) {
          updateData.status = "completed"
          updateData.completed_at = new Date().toISOString()
        }
      } else if (goal.goal_type === "streak" || goal.goal_type === "count") {
        updateData.current_count = value
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

  // 開啟編輯
  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalDialogOpen(true)
  }

  // 開啟更新進度
  const openUpdateProgress = (goal: Goal) => {
    setSelectedGoal(goal)
    setUpdateProgressOpen(true)
  }

  // 統計
  const stats = {
    total: goals.filter(g => g.status !== "archived").length,
    active: goals.filter(g => g.status === "active").length,
    completed: goals.filter(g => g.status === "completed").length,
    paused: goals.filter(g => g.status === "paused").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">🎯 目標管理</h1>
        </div>
        <Button onClick={() => {
          setEditingGoal(null)
          setGoalDialogOpen(true)
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          新增目標
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-all ${filter === "all" ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-gray-50"}`}
          onClick={() => setFilter("all")}
        >
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">全部目標</div>
        </div>
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-all ${filter === "active" ? "bg-green-50 border-green-300" : "bg-white hover:bg-gray-50"}`}
          onClick={() => setFilter("active")}
        >
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">進行中</div>
        </div>
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-all ${filter === "completed" ? "bg-purple-50 border-purple-300" : "bg-white hover:bg-gray-50"}`}
          onClick={() => setFilter("completed")}
        >
          <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-all ${filter === "paused" ? "bg-gray-100 border-gray-300" : "bg-white hover:bg-gray-50"}`}
          onClick={() => setFilter("paused")}
        >
          <div className="text-2xl font-bold text-gray-600">{stats.paused}</div>
          <div className="text-sm text-gray-500">已暫停</div>
        </div>
      </div>

      {/* 目標列表 */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {filter === "all" ? "還沒有目標" : `沒有${filter === "active" ? "進行中" : filter === "completed" ? "已完成" : "暫停"}的目標`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === "all" ? "建立你的第一個目標，開始追蹤進度吧！" : ""}
          </p>
          {filter === "all" && (
            <Button onClick={() => setGoalDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              建立目標
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
              onUpdateProgress={openUpdateProgress}
            />
          ))}
        </div>
      )}

      {/* 對話框 */}
      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={(open) => {
          setGoalDialogOpen(open)
          if (!open) setEditingGoal(null)
        }}
        onSave={handleSaveGoal}
        saving={saving}
        editGoal={editingGoal}
      />

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
