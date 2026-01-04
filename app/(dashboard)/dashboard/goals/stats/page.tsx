// app/(dashboard)/dashboard/goals/stats/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { format, subMonths } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Goal } from "@/components/goals/goal-card"
import { useGoalProgress } from "@/lib/hooks/use-goal-progress"
import { ArrowLeft, TrendingUp, Calendar, BarChart3, Target, CheckCircle } from "lucide-react"

interface PeriodStat {
  period: string
  value: number
  target: number
}

export default function GoalStatsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const goalId = searchParams.get("id")

  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalId || "")
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [periodType, setPeriodType] = useState<"month" | "year">("month")
  const [stats, setStats] = useState<PeriodStat[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const { getGoalPeriodStats, calcPeriodProgress } = useGoalProgress()

  // 載入目標列表
  const fetchGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    // 只載入有自動追蹤且非單次的目標，或週期性目標
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .neq("track_source", "manual")
      .order("created_at", { ascending: false })

    if (data) {
      setGoals(data as Goal[])
      // 如果有 URL 參數，選擇該目標
      if (goalId && data.find(g => g.id === goalId)) {
        setSelectedGoalId(goalId)
      } else if (data.length > 0) {
        setSelectedGoalId(data[0].id)
      }
    }
    setLoading(false)
  }, [goalId])

  // 載入統計資料
  const fetchStats = useCallback(async () => {
    if (!selectedGoalId || !userId) return

    const goal = goals.find(g => g.id === selectedGoalId)
    if (!goal) return

    setSelectedGoal(goal)
    setStatsLoading(true)

    const periodsCount = periodType === "month" ? 12 : 5
    const data = await getGoalPeriodStats(goal, userId, periodType, periodsCount)
    setStats(data)
    setStatsLoading(false)
  }, [selectedGoalId, userId, goals, periodType, getGoalPeriodStats])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  useEffect(() => {
    if (selectedGoalId && userId) {
      fetchStats()
    }
  }, [selectedGoalId, userId, periodType, fetchStats])

  // 計算統計數據
  const totalValue = stats.reduce((sum, s) => sum + s.value, 0)
  const avgValue = stats.length > 0 ? totalValue / stats.length : 0
  const achievedPeriods = stats.filter(s => s.value >= s.target).length
  const maxValue = Math.max(...stats.map(s => s.value), 1)

  // 取得單位
  const getUnit = () => {
    if (!selectedGoal) return ""
    if (selectedGoal.goal_type === "numeric") return selectedGoal.unit || ""
    return selectedGoal.unit || "次"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
            onClick={() => router.push("/dashboard/goals")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">📊 目標統計</h1>
        </div>
      </div>

      {/* 目標選擇和週期切換 */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
            <SelectTrigger>
              <SelectValue placeholder="選擇目標" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.icon} {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={periodType === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("month")}
          >
            月統計
          </Button>
          <Button
            variant={periodType === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("year")}
          >
            年統計
          </Button>
        </div>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">尚無可統計的目標</p>
            <p className="text-sm text-gray-400 mt-1">
              建立自動追蹤的目標後，即可查看統計數據
            </p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/dashboard/goals")}
            >
              新增目標
            </Button>
          </CardContent>
        </Card>
      ) : selectedGoal && (
        <>
          {/* 統計摘要卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">累計總額</span>
                </div>
                <div className="text-2xl font-bold">
                  {totalValue.toLocaleString()} {getUnit()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {periodType === "month" ? "月平均" : "年平均"}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {avgValue.toFixed(1)} {getUnit()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {periodType === "month" ? "每月目標" : "每年目標"}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {(selectedGoal.period_target || selectedGoal.target_value || selectedGoal.target_count || 0).toLocaleString()} {getUnit()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">達成次數</span>
                </div>
                <div className="text-2xl font-bold">
                  {achievedPeriods} / {stats.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 長條圖 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {periodType === "month" ? "月度趨勢" : "年度趨勢"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.map((stat, index) => {
                    const percentage = (stat.value / maxValue) * 100
                    const targetPercentage = (stat.target / maxValue) * 100
                    const isAchieved = stat.value >= stat.target
                    const isCurrent = index === stats.length - 1

                    return (
                      <div key={stat.period} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${isCurrent ? "text-blue-600" : "text-gray-600"}`}>
                            {stat.period} {isCurrent && "(當期)"}
                          </span>
                          <span className={`font-bold ${isAchieved ? "text-green-600" : "text-gray-800"}`}>
                            {stat.value.toLocaleString()} {getUnit()}
                            {isAchieved && " ✓"}
                          </span>
                        </div>
                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                          {/* 目標線 */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                            style={{ left: `${Math.min(targetPercentage, 100)}%` }}
                          />
                          {/* 進度條 */}
                          <div
                            className={`h-full rounded-lg transition-all ${
                              isAchieved 
                                ? "bg-gradient-to-r from-green-400 to-green-500" 
                                : isCurrent 
                                  ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                  : "bg-gradient-to-r from-gray-300 to-gray-400"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                          {/* 數值標籤 */}
                          <div 
                            className="absolute inset-y-0 flex items-center px-2 text-xs font-medium text-white"
                            style={{ left: Math.min(percentage, 100) > 30 ? '8px' : `${Math.min(percentage, 100) + 2}%` }}
                          >
                            {percentage > 30 && `${Math.round(stat.value / stat.target * 100)}%`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 圖例 */}
              <div className="flex items-center gap-6 mt-6 pt-4 border-t text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span>達成目標</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span>當期進度</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 bg-red-400" />
                  <span>目標線</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 詳細數據表 */}
          <Card>
            <CardHeader>
              <CardTitle>詳細數據</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">期間</th>
                      <th className="text-right py-2 px-3">實際值</th>
                      <th className="text-right py-2 px-3">目標值</th>
                      <th className="text-right py-2 px-3">達成率</th>
                      <th className="text-center py-2 px-3">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats].reverse().map((stat, index) => {
                      const achieveRate = stat.target > 0 ? (stat.value / stat.target * 100) : 0
                      const isAchieved = stat.value >= stat.target
                      const isCurrent = index === 0

                      return (
                        <tr key={stat.period} className={`border-b ${isCurrent ? "bg-blue-50" : ""}`}>
                          <td className="py-2 px-3 font-medium">
                            {stat.period} {isCurrent && <span className="text-blue-600">(當期)</span>}
                          </td>
                          <td className="text-right py-2 px-3">
                            {stat.value.toLocaleString()} {getUnit()}
                          </td>
                          <td className="text-right py-2 px-3 text-gray-500">
                            {stat.target.toLocaleString()} {getUnit()}
                          </td>
                          <td className={`text-right py-2 px-3 font-medium ${
                            achieveRate >= 100 ? "text-green-600" : 
                            achieveRate >= 70 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {achieveRate.toFixed(1)}%
                          </td>
                          <td className="text-center py-2 px-3">
                            {isAchieved ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                達成
                              </span>
                            ) : isCurrent ? (
                              <span className="text-blue-600">進行中</span>
                            ) : (
                              <span className="text-gray-400">未達成</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
