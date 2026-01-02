// app/(dashboard)/dashboard/finance/budget/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Target,
  AlertCircle,
  Copy,
} from "lucide-react"

// 類型定義
interface FinanceCategory {
  id: string
  user_id: string | null
  type: "income" | "expense"
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  is_default: boolean
}

interface Budget {
  id: string
  user_id: string
  year_month: string
  category_id: string | null
  amount: number
  created_at: string | null
  updated_at: string | null
}

interface BudgetWithCategory extends Budget {
  finance_categories: FinanceCategory | null
}

export default function BudgetPage() {
  // 當前選擇的年月
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // 當月支出統計
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({})
  const [totalExpense, setTotalExpense] = useState(0)

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null)
  const [budgetCategoryId, setBudgetCategoryId] = useState<string>("__total__")
  const [budgetAmount, setBudgetAmount] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 複製上月狀態
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copyLoading, setCopyLoading] = useState(false)

  // 格式化月份顯示
  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-")
    return `${year} 年 ${parseInt(month)} 月`
  }

  // 上個月
  const getPrevMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-").map(Number)
    if (month === 1) {
      return `${year - 1}-12`
    }
    return `${year}-${String(month - 1).padStart(2, "0")}`
  }

  // 下個月
  const getNextMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-").map(Number)
    if (month === 12) {
      return `${year + 1}-01`
    }
    return `${year}-${String(month + 1).padStart(2, "0")}`
  }

  // 載入資料
  const fetchData = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    // 載入分類（只要支出分類）
    const [userCategoriesRes, defaultCategoriesRes] = await Promise.all([
      supabase
        .from("finance_categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .order("sort_order", { ascending: true }),
      supabase
        .from("finance_categories")
        .select("*")
        .is("user_id", null)
        .eq("type", "expense")
        .order("sort_order", { ascending: true }),
    ])

    const allCategories = [
      ...(defaultCategoriesRes.data || []),
      ...(userCategoriesRes.data || []),
    ] as FinanceCategory[]
    setCategories(allCategories)

    // 載入當月預算
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select(`
        *,
        finance_categories (*)
      `)
      .eq("user_id", user.id)
      .eq("year_month", selectedMonth)
      .order("created_at", { ascending: true })

    setBudgets((budgetsData as BudgetWithCategory[]) || [])

    // 載入當月支出統計
    const startDate = `${selectedMonth}-01`
    const [year, month] = selectedMonth.split("-").map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${selectedMonth}-${lastDay}`

    const { data: expensesData } = await supabase
      .from("finance_records")
      .select("category_id, amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate)

    if (expensesData) {
      const expensesByCategory: Record<string, number> = {}
      let total = 0

      expensesData.forEach((record) => {
        // 使用 category_id，如果沒有則用 "__uncategorized__"
        const catId = record.category_id || "__uncategorized__"
        expensesByCategory[catId] = (expensesByCategory[catId] || 0) + Number(record.amount)
        total += Number(record.amount)
      })

      setMonthlyExpenses(expensesByCategory)
      setTotalExpense(total)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  // 取得總預算
  const totalBudget = useMemo(() => {
    return budgets.find((b) => b.category_id === null)
  }, [budgets])

  // 取得分類預算
  const categoryBudgets = useMemo(() => {
    return budgets.filter((b) => b.category_id !== null)
  }, [budgets])

  // 計算已設定預算的分類總和
  const categoryBudgetsSum = useMemo(() => {
    return categoryBudgets.reduce((sum, b) => sum + Number(b.amount), 0)
  }, [categoryBudgets])

  // 已設定預算的分類 ID
  const budgetedCategoryIds = useMemo(() => {
    return new Set(categoryBudgets.map((b) => b.category_id))
  }, [categoryBudgets])

  // 未設定預算的分類
  const unbugdetedCategories = useMemo(() => {
    return categories.filter((c) => !budgetedCategoryIds.has(c.id))
  }, [categories, budgetedCategoryIds])

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingBudget(null)
    setBudgetCategoryId("__total__")
    setBudgetAmount(null)
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (budget: BudgetWithCategory) => {
    setEditingBudget(budget)
    setBudgetCategoryId(budget.category_id || "__total__")
    setBudgetAmount(Number(budget.amount))
    setFormOpen(true)
  }

  // 儲存預算
  const handleSave = async () => {
    if (!budgetAmount || budgetAmount <= 0 || !userId) return

    setSaving(true)

    const categoryId = budgetCategoryId === "__total__" ? null : budgetCategoryId

    if (editingBudget) {
      // 編輯
      const { error } = await supabase
        .from("budgets")
        .update({
          category_id: categoryId,
          amount: budgetAmount,
        })
        .eq("id", editingBudget.id)

      if (error) {
        console.error("更新預算失敗:", error)
        alert(`儲存失敗: ${error.message}`)
      }
    } else {
      // 新增
      const { error } = await supabase
        .from("budgets")
        .insert({
          user_id: userId,
          year_month: selectedMonth,
          category_id: categoryId,
          amount: budgetAmount,
        })

      if (error) {
        console.error("新增預算失敗:", error)
        if (error.code === "23505") {
          alert("此預算項目已存在，請選擇其他分類或編輯現有預算。")
        } else {
          alert(`儲存失敗: ${error.message}`)
        }
      }
    }

    setSaving(false)
    setFormOpen(false)
    fetchData()
  }

  // 刪除預算
  const openDeleteDialog = (budget: BudgetWithCategory) => {
    setDeletingBudget(budget)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBudget) return

    setDeleteLoading(true)

    await supabase.from("budgets").delete().eq("id", deletingBudget.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingBudget(null)
    fetchData()
  }

  // 複製上月預算
  const handleCopyFromLastMonth = async () => {
    if (!userId) return

    setCopyLoading(true)

    const prevMonth = getPrevMonth(selectedMonth)

    // 取得上月預算
    const { data: prevBudgets } = await supabase
      .from("budgets")
      .select("category_id, amount")
      .eq("user_id", userId)
      .eq("year_month", prevMonth)

    if (!prevBudgets || prevBudgets.length === 0) {
      alert("上個月沒有預算記錄可複製")
      setCopyLoading(false)
      setCopyDialogOpen(false)
      return
    }

    // 建立當月預算
    const newBudgets = prevBudgets.map((b) => ({
      user_id: userId,
      year_month: selectedMonth,
      category_id: b.category_id,
      amount: b.amount,
    }))

    const { error } = await supabase.from("budgets").insert(newBudgets)

    if (error) {
      if (error.code === "23505") {
        alert("部分預算已存在，請手動調整。")
      } else {
        alert(`複製失敗: ${error.message}`)
      }
    }

    setCopyLoading(false)
    setCopyDialogOpen(false)
    fetchData()
  }

  // 計算使用百分比
  const getUsagePercent = (spent: number, budget: number) => {
    if (budget <= 0) return 0
    return Math.min((spent / budget) * 100, 100)
  }

  // 取得進度條顏色
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500"
    if (percent >= 80) return "bg-amber-500"
    return "bg-green-500"
  }

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
            <h1 className="text-2xl font-bold text-gray-800">預算管理</h1>
            <p className="text-gray-500">設定每月支出預算</p>
          </div>
        </div>
      </div>

      {/* 月份選擇器 */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold text-gray-800 min-w-[140px] text-center">
          {formatMonth(selectedMonth)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2 justify-end">
        {budgets.length === 0 && (
          <Button variant="outline" onClick={() => setCopyDialogOpen(true)}>
            <Copy className="w-4 h-4 mr-2" />
            複製上月預算
          </Button>
        )}
        <Button onClick={openCreateForm} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          新增預算
        </Button>
      </div>

      {/* 總預算卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-600" />
            總預算
          </CardTitle>
          <CardDescription>
            當月整體支出控管
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalBudget ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-800">
                    ${Number(totalBudget.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    已支出 ${totalExpense.toLocaleString()} / 剩餘 ${Math.max(0, Number(totalBudget.amount) - totalExpense).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditForm(totalBudget)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => openDeleteDialog(totalBudget)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* 進度條 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">使用進度</span>
                  <span className={`font-medium ${
                    getUsagePercent(totalExpense, Number(totalBudget.amount)) >= 100 
                      ? "text-red-600" 
                      : getUsagePercent(totalExpense, Number(totalBudget.amount)) >= 80
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}>
                    {getUsagePercent(totalExpense, Number(totalBudget.amount)).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(
                      getUsagePercent(totalExpense, Number(totalBudget.amount))
                    )}`}
                    style={{ width: `${getUsagePercent(totalExpense, Number(totalBudget.amount))}%` }}
                  />
                </div>
              </div>

              {/* 超支提醒 */}
              {totalExpense > Number(totalBudget.amount) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    已超支 ${(totalExpense - Number(totalBudget.amount)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">尚未設定總預算</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setBudgetCategoryId("__total__")
                  setBudgetAmount(null)
                  setEditingBudget(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                設定總預算
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分類預算 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            分類預算
          </CardTitle>
          <CardDescription>
            各支出分類的預算控管
            {categoryBudgetsSum > 0 && (
              <span className="ml-2">
                （分類預算合計：${categoryBudgetsSum.toLocaleString()}）
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryBudgets.length > 0 ? (
            <div className="space-y-4">
              {categoryBudgets.map((budget) => {
                const category = budget.finance_categories
                const spent = monthlyExpenses[budget.category_id || ""] || 0
                const percent = getUsagePercent(spent, Number(budget.amount))

                return (
                  <div key={budget.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${category?.color || "#6b7280"}20` }}
                        >
                          {category?.icon || "📦"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {category?.name || "未分類"}
                          </p>
                          <p className="text-sm text-gray-500">
                            已支出 ${spent.toLocaleString()} / 預算 ${Number(budget.amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          percent >= 100 ? "text-red-600" : 
                          percent >= 80 ? "text-amber-600" : "text-green-600"
                        }`}>
                          {percent.toFixed(0)}%
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(budget)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600"
                          onClick={() => openDeleteDialog(budget)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* 進度條 */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* 新增更多分類預算 */}
              {unbugdetedCategories.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setBudgetCategoryId(unbugdetedCategories[0].id)
                    setBudgetAmount(null)
                    setEditingBudget(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新增分類預算
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">尚未設定分類預算</p>
              <Button
                variant="outline"
                onClick={() => {
                  if (categories.length > 0) {
                    setBudgetCategoryId(categories[0].id)
                    setBudgetAmount(null)
                    setEditingBudget(null)
                    setFormOpen(true)
                  }
                }}
                disabled={categories.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                新增分類預算
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯預算對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "編輯預算" : "新增預算"}
            </DialogTitle>
            <DialogDescription>
              設定 {formatMonth(selectedMonth)} 的預算
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>預算類型</Label>
              <Select
                value={budgetCategoryId}
                onValueChange={setBudgetCategoryId}
                disabled={!!editingBudget}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇類型" />
                </SelectTrigger>
                <SelectContent>
                  {/* 總預算選項 */}
                  {(!totalBudget || editingBudget?.category_id === null) && (
                    <SelectItem value="__total__">
                      💰 總預算
                    </SelectItem>
                  )}
                  
                  {/* 分類預算選項 */}
                  {(editingBudget
                    ? categories
                    : unbugdetedCategories
                  ).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon || "📦"} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>預算金額</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={budgetAmount || ""}
                onChange={(e) => setBudgetAmount(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="輸入預算金額"
              />
            </div>

            {/* 提示 */}
            {budgetCategoryId === "__total__" && categoryBudgetsSum > 0 && (
              <p className="text-sm text-gray-500">
                💡 目前分類預算合計為 ${categoryBudgetsSum.toLocaleString()}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!budgetAmount || budgetAmount <= 0 || saving}
              className="bg-amber-600 hover:bg-amber-700"
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
            <AlertDialogTitle>確定要刪除此預算嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後無法復原。
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

      {/* 複製上月確認 */}
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>複製上月預算</AlertDialogTitle>
            <AlertDialogDescription>
              將 {formatMonth(getPrevMonth(selectedMonth))} 的預算設定複製到 {formatMonth(selectedMonth)}。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCopyFromLastMonth}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={copyLoading}
            >
              {copyLoading ? "複製中..." : "確定複製"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
