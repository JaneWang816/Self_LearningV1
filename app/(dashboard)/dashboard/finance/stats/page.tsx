// app/(dashboard)/dashboard/finance/stats/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// 類型定義
interface FinanceCategory {
  id: string
  name: string
  type: "income" | "expense"
  icon: string | null
  color: string | null
}

interface FinanceRecord {
  id: string
  user_id: string
  type: "income" | "expense"
  category_id: string | null
  category: string
  amount: number
  description: string | null
  date: string
}

interface Budget {
  id: string
  user_id: string
  year_month: string
  category_id: string | null
  amount: number
}

interface MonthlyData {
  month: string
  monthLabel: string
  income: number
  expense: number
  balance: number
}

interface CategoryData {
  name: string
  value: number
  icon: string
  color: string
  percent: number
}

interface DailyData {
  date: string
  dateLabel: string
  expense: number
}

// 顏色常量
const EXPENSE_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", 
  "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
]

const INCOME_COLORS = [
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
]

export default function FinanceStatsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"1" | "3" | "6" | "12">("3")
  
  // 原始數據
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  
  // 計算當前月份
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  }, [])

  // 載入資料
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // 計算日期範圍
      const months = parseInt(timeRange)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months + 1)
      startDate.setDate(1)
      
      const startStr = startDate.toISOString().split("T")[0]
      const endStr = endDate.toISOString().split("T")[0]

      // 載入分類
      const [defaultCatRes, userCatRes] = await Promise.all([
        supabase
          .from("finance_categories")
          .select("*")
          .is("user_id", null),
        supabase
          .from("finance_categories")
          .select("*")
          .eq("user_id", user.id),
      ])

      const allCategories = [
        ...(defaultCatRes.data || []),
        ...(userCatRes.data || []),
      ] as FinanceCategory[]
      setCategories(allCategories)

      // 載入記錄
      const { data: recordsData } = await supabase
        .from("finance_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date", { ascending: true })

      setRecords((recordsData || []) as FinanceRecord[])

      // 載入當月預算
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("year_month", currentMonth)

      setBudgets((budgetsData || []) as Budget[])

      setLoading(false)
    }

    fetchData()
  }, [timeRange, currentMonth])

  // 建立分類查詢表
  const categoryMap = useMemo(() => {
    const map = new Map<string, FinanceCategory>()
    categories.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  // ============================================
  // 計算統計數據
  // ============================================

  // 本月記錄
  const currentMonthRecords = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number)
    return records.filter((r) => {
      const d = new Date(r.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
  }, [records, currentMonth])

  // 上月記錄
  const lastMonthRecords = useMemo(() => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const year = lastMonth.getFullYear()
    const month = lastMonth.getMonth() + 1
    return records.filter((r) => {
      const d = new Date(r.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
  }, [records])

  // 本月收入/支出
  const currentMonthIncome = currentMonthRecords
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + Number(r.amount), 0)
  
  const currentMonthExpense = currentMonthRecords
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const currentMonthBalance = currentMonthIncome - currentMonthExpense

  // 上月收入/支出
  const lastMonthIncome = lastMonthRecords
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const lastMonthExpense = lastMonthRecords
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + Number(r.amount), 0)

  // 日均支出（本月）
  const daysInCurrentMonth = new Date().getDate()
  const dailyAvgExpense = daysInCurrentMonth > 0 
    ? currentMonthExpense / daysInCurrentMonth 
    : 0

  // 與上月比較百分比
  const incomeChange = lastMonthIncome > 0 
    ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 
    : 0

  const expenseChange = lastMonthExpense > 0 
    ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 
    : 0

  // ============================================
  // 圖表數據
  // ============================================

  // 每月收支趨勢
  const monthlyTrendData = useMemo((): MonthlyData[] => {
    const monthMap = new Map<string, { income: number; expense: number }>()
    
    records.forEach((r) => {
      const month = r.date.slice(0, 7) // YYYY-MM
      if (!monthMap.has(month)) {
        monthMap.set(month, { income: 0, expense: 0 })
      }
      const data = monthMap.get(month)!
      if (r.type === "income") {
        data.income += Number(r.amount)
      } else {
        data.expense += Number(r.amount)
      }
    })

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthLabel: `${parseInt(month.split("-")[1])}月`,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }))
  }, [records])

  // 支出分類佔比
  const expenseByCategoryData = useMemo((): CategoryData[] => {
    const catMap = new Map<string, number>()
    
    currentMonthRecords
      .filter((r) => r.type === "expense")
      .forEach((r) => {
        const catId = r.category_id || "__uncategorized__"
        catMap.set(catId, (catMap.get(catId) || 0) + Number(r.amount))
      })

    const total = Array.from(catMap.values()).reduce((a, b) => a + b, 0)

    return Array.from(catMap.entries())
      .map(([catId, value], index) => {
        const cat = categoryMap.get(catId)
        return {
          name: cat?.name || "未分類",
          value,
          icon: cat?.icon || "📦",
          color: cat?.color || EXPENSE_COLORS[index % EXPENSE_COLORS.length],
          percent: total > 0 ? (value / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [currentMonthRecords, categoryMap])

  // 收入分類佔比
  const incomeByCategoryData = useMemo((): CategoryData[] => {
    const catMap = new Map<string, number>()
    
    currentMonthRecords
      .filter((r) => r.type === "income")
      .forEach((r) => {
        const catId = r.category_id || "__uncategorized__"
        catMap.set(catId, (catMap.get(catId) || 0) + Number(r.amount))
      })

    const total = Array.from(catMap.values()).reduce((a, b) => a + b, 0)

    return Array.from(catMap.entries())
      .map(([catId, value], index) => {
        const cat = categoryMap.get(catId)
        return {
          name: cat?.name || "未分類",
          value,
          icon: cat?.icon || "📦",
          color: cat?.color || INCOME_COLORS[index % INCOME_COLORS.length],
          percent: total > 0 ? (value / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [currentMonthRecords, categoryMap])

  // 每日支出趨勢（本月）
  const dailyExpenseData = useMemo((): DailyData[] => {
    const dayMap = new Map<string, number>()
    
    currentMonthRecords
      .filter((r) => r.type === "expense")
      .forEach((r) => {
        dayMap.set(r.date, (dayMap.get(r.date) || 0) + Number(r.amount))
      })

    // 填充本月所有日期
    const [year, month] = currentMonth.split("-").map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = new Date().getDate()
    const result: DailyData[] = []

    for (let d = 1; d <= Math.min(daysInMonth, today); d++) {
      const dateStr = `${currentMonth}-${String(d).padStart(2, "0")}`
      result.push({
        date: dateStr,
        dateLabel: `${d}日`,
        expense: dayMap.get(dateStr) || 0,
      })
    }

    return result
  }, [currentMonthRecords, currentMonth])

  // 最大支出分類
  const topExpenseCategory = expenseByCategoryData[0] || null

  // ============================================
  // 預算相關
  // ============================================

  const totalBudget = budgets.find((b) => b.category_id === null)
  const categoryBudgets = budgets.filter((b) => b.category_id !== null)

  // 預算使用狀況
  const budgetUsage = useMemo(() => {
    if (!totalBudget) return null
    
    const budgetAmount = Number(totalBudget.amount)
    const usedPercent = budgetAmount > 0 ? (currentMonthExpense / budgetAmount) * 100 : 0
    const remaining = budgetAmount - currentMonthExpense

    return {
      budget: budgetAmount,
      used: currentMonthExpense,
      remaining,
      usedPercent,
      isOver: remaining < 0,
    }
  }, [totalBudget, currentMonthExpense])

  // 分類預算使用狀況
  const categoryBudgetUsage = useMemo(() => {
    return categoryBudgets.map((b) => {
      const cat = categoryMap.get(b.category_id || "")
      const spent = currentMonthRecords
        .filter((r) => r.type === "expense" && r.category_id === b.category_id)
        .reduce((sum, r) => sum + Number(r.amount), 0)
      
      const budgetAmount = Number(b.amount)
      const usedPercent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

      return {
        categoryId: b.category_id,
        categoryName: cat?.name || "未知分類",
        categoryIcon: cat?.icon || "📦",
        categoryColor: cat?.color || "#6b7280",
        budget: budgetAmount,
        spent,
        usedPercent,
        isOver: spent > budgetAmount,
      }
    })
  }, [categoryBudgets, currentMonthRecords, categoryMap])

  // ============================================
  // 理財建議
  // ============================================

  const financialAdvice = useMemo(() => {
    const advice: { type: "warning" | "info" | "success"; message: string }[] = []

    // 收支平衡檢查
    if (currentMonthBalance < 0) {
      advice.push({
        type: "warning",
        message: `本月支出超過收入 $${Math.abs(currentMonthBalance).toLocaleString()}，建議檢視支出項目。`,
      })
    } else if (currentMonthBalance > 0) {
      advice.push({
        type: "success",
        message: `本月結餘 $${currentMonthBalance.toLocaleString()}，持續保持良好的理財習慣！`,
      })
    }

    // 預算超支檢查
    if (budgetUsage?.isOver) {
      advice.push({
        type: "warning",
        message: `本月已超出預算 $${Math.abs(budgetUsage.remaining).toLocaleString()}，請注意控制支出。`,
      })
    } else if (budgetUsage && budgetUsage.usedPercent >= 80) {
      advice.push({
        type: "info",
        message: `預算已使用 ${budgetUsage.usedPercent.toFixed(0)}%，剩餘 $${budgetUsage.remaining.toLocaleString()}。`,
      })
    }

    // 分類預算超支
    const overCategories = categoryBudgetUsage.filter((c) => c.isOver)
    if (overCategories.length > 0) {
      advice.push({
        type: "warning",
        message: `${overCategories.map((c) => c.categoryName).join("、")} 已超出分類預算。`,
      })
    }

    // 支出變化檢查
    if (expenseChange > 20) {
      advice.push({
        type: "info",
        message: `本月支出比上月增加 ${expenseChange.toFixed(0)}%，可檢視是否有非必要開支。`,
      })
    } else if (expenseChange < -20) {
      advice.push({
        type: "success",
        message: `本月支出比上月減少 ${Math.abs(expenseChange).toFixed(0)}%，節約有成！`,
      })
    }

    // 最大支出分類建議
    if (topExpenseCategory && topExpenseCategory.percent > 50) {
      advice.push({
        type: "info",
        message: `「${topExpenseCategory.name}」佔支出 ${topExpenseCategory.percent.toFixed(0)}%，為最大支出項目。`,
      })
    }

    // 無記錄提醒
    if (currentMonthRecords.length === 0) {
      advice.push({
        type: "info",
        message: "本月尚無收支記錄，開始記錄您的財務狀況吧！",
      })
    }

    return advice
  }, [
    currentMonthBalance,
    budgetUsage,
    categoryBudgetUsage,
    expenseChange,
    topExpenseCategory,
    currentMonthRecords,
  ])

  // ============================================
  // 渲染
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">財務統計</h1>
            <p className="text-gray-500">分析您的收支狀況</p>
          </div>
        </div>

        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">本月</SelectItem>
            <SelectItem value="3">近 3 個月</SelectItem>
            <SelectItem value="6">近 6 個月</SelectItem>
            <SelectItem value="12">近 12 個月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 數據卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 本月收入 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              {incomeChange !== 0 && (
                <span className={`text-xs flex items-center gap-1 ${
                  incomeChange > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {incomeChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(incomeChange).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-3">
              ${currentMonthIncome.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">本月收入</p>
          </CardContent>
        </Card>

        {/* 本月支出 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              {expenseChange !== 0 && (
                <span className={`text-xs flex items-center gap-1 ${
                  expenseChange > 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {expenseChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(expenseChange).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-3">
              ${currentMonthExpense.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">本月支出</p>
          </CardContent>
        </Card>

        {/* 本月結餘 */}
        <Card>
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <p className={`text-2xl font-bold mt-3 ${
              currentMonthBalance >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {currentMonthBalance >= 0 ? "+" : ""}${currentMonthBalance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">本月結餘</p>
          </CardContent>
        </Card>

        {/* 日均支出 */}
        <Card>
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-3">
              ${dailyAvgExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500">日均支出</p>
          </CardContent>
        </Card>
      </div>

      {/* 預算達成率 */}
      {budgetUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-amber-600" />
              預算達成率
            </CardTitle>
            <CardDescription>本月預算使用狀況</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 總預算 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">總預算</span>
                <span className="text-sm">
                  ${budgetUsage.used.toLocaleString()} / ${budgetUsage.budget.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetUsage.isOver ? "bg-red-500" :
                    budgetUsage.usedPercent >= 80 ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(budgetUsage.usedPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${
                  budgetUsage.isOver ? "text-red-600" :
                  budgetUsage.usedPercent >= 80 ? "text-amber-600" : "text-green-600"
                }`}>
                  {budgetUsage.usedPercent.toFixed(1)}%
                </span>
                <span className={`text-xs ${budgetUsage.isOver ? "text-red-600" : "text-gray-500"}`}>
                  {budgetUsage.isOver ? "超支" : "剩餘"} ${Math.abs(budgetUsage.remaining).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 分類預算 */}
            {categoryBudgetUsage.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium text-gray-700">分類預算</p>
                {categoryBudgetUsage.map((item) => (
                  <div key={item.categoryId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        {item.categoryIcon} {item.categoryName}
                      </span>
                      <span className="text-xs text-gray-500">
                        ${item.spent.toLocaleString()} / ${item.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.isOver ? "bg-red-500" :
                          item.usedPercent >= 80 ? "bg-amber-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(item.usedPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 設定預算提示 */}
            {categoryBudgetUsage.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                <Link href="/dashboard/finance/budget" className="text-amber-600 hover:underline">
                  設定分類預算 →
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 無預算提示 */}
      {!totalBudget && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">尚未設定預算</p>
              <p className="text-sm text-amber-600">設定預算幫助你更好地控制支出</p>
            </div>
            <Link href="/dashboard/finance/budget">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                設定預算
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 收支趨勢圖 */}
      <Card>
        <CardHeader>
          <CardTitle>收支趨勢</CardTitle>
          <CardDescription>每月收入與支出對比</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === "income" ? "收入" : name === "expense" ? "支出" : "結餘"
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend 
                  formatter={(value) => value === "income" ? "收入" : value === "expense" ? "支出" : "結餘"}
                />
                <Bar dataKey="income" fill="#22c55e" name="income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              無資料
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分類佔比 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 支出分類 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">支出分類</CardTitle>
            <CardDescription>本月各分類支出佔比</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCategoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseByCategoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color || EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {expenseByCategoryData.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color || EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                        />
                        <span>{item.icon} {item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">${item.value.toLocaleString()}</span>
                        <span className="text-gray-500 ml-2">({item.percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                本月無支出記錄
              </div>
            )}
          </CardContent>
        </Card>

        {/* 收入分類 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">收入分類</CardTitle>
            <CardDescription>本月各分類收入佔比</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeByCategoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={incomeByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {incomeByCategoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color || INCOME_COLORS[index % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {incomeByCategoryData.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color || INCOME_COLORS[index % INCOME_COLORS.length] }}
                        />
                        <span>{item.icon} {item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">${item.value.toLocaleString()}</span>
                        <span className="text-gray-500 ml-2">({item.percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                本月無收入記錄
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 每日支出趨勢 */}
      <Card>
        <CardHeader>
          <CardTitle>每日支出</CardTitle>
          <CardDescription>本月每日支出趨勢</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(dailyExpenseData.length / 10)}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "支出"]}
                />
                {/* 日均線 */}
                <Line
                  type="monotone"
                  dataKey={() => dailyAvgExpense}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name="日均"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              本月無支出記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 理財建議 */}
      {financialAdvice.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              理財建議
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {financialAdvice.map((advice, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  advice.type === "warning" ? "bg-red-50" :
                  advice.type === "success" ? "bg-green-50" : "bg-blue-50"
                }`}
              >
                {advice.type === "warning" ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                ) : advice.type === "success" ? (
                  <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  advice.type === "warning" ? "text-red-700" :
                  advice.type === "success" ? "text-green-700" : "text-blue-700"
                }`}>
                  {advice.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
