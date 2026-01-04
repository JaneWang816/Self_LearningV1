// app/(dashboard)/dashboard/finance/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
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
import Link from "next/link"
import {
  Wallet,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  PieChart,
  Banknote,
  PiggyBank, 
  Target,
  BarChart2,
} from "lucide-react"

// 分類類型
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

// 記錄類型（含分類資訊）
interface FinanceRecordWithCategory {
  id: string
  user_id: string
  type: "income" | "expense"
  category_id: string | null
  category: string // 舊欄位，向後相容
  amount: number
  description: string | null
  date: string
  created_at: string | null
  // 關聯的分類資訊
  finance_categories: FinanceCategory | null
}

export default function FinancePage() {
  const [records, setRecords] = useState<FinanceRecordWithCategory[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [initialBalance, setInitialBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  // 篩選
  const [filterType, setFilterType] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )
  const [searchQuery, setSearchQuery] = useState("")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecordWithCategory | null>(null)
  const [recordType, setRecordType] = useState<"income" | "expense">("expense")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)
  const [budgets, setBudgets] = useState<any[]>([])
  const [totalBudget, setTotalBudget] = useState<number | null>(null)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecordWithCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    // 取得當月預算
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .eq("year_month", currentMonth)

    if (budgetsData) {
      setBudgets(budgetsData)
      const total = budgetsData.find((b: any) => b.category_id === null)
      setTotalBudget(total ? Number(total.amount) : null)
    }
    
    // 分開查詢記錄、用戶分類、預設分類
    const [recordsRes, userCategoriesRes, defaultCategoriesRes, profileRes] = await Promise.all([
      supabase
        .from("finance_records")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      // 用戶自訂分類
      supabase
        .from("finance_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true }),
      // 預設分類
      supabase
        .from("finance_categories")
        .select("*")
        .is("user_id", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("profiles")
        .select("initial_balance")
        .eq("id", user.id)
        .single(),
    ])

    // 合併分類（預設在前，自訂在後）
    const allCategories = [
      ...(defaultCategoriesRes.data || []),
      ...(userCategoriesRes.data || []),
    ] as FinanceCategory[]

    // 建立分類對照表
    const categoryMap = new Map<string, FinanceCategory>()
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, cat)
    })
    setCategories(allCategories)

    // 組合記錄與分類
    if (recordsRes.data) {
      const recordsWithCategory: FinanceRecordWithCategory[] = recordsRes.data.map((record) => ({
        id: record.id,
        user_id: record.user_id,
        type: record.type as "income" | "expense",
        category_id: record.category_id,
        category: record.category,
        amount: record.amount,
        description: record.description,
        date: record.date,
        created_at: record.created_at,
        finance_categories: record.category_id ? categoryMap.get(record.category_id) || null : null,
      }))
      setRecords(recordsWithCategory)
    }

    if (profileRes.data?.initial_balance) {
      setInitialBalance(Number(profileRes.data.initial_balance))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 依類型分類
  const expenseCategories = useMemo(() => 
    categories.filter(c => c.type === "expense"), [categories])
  const incomeCategories = useMemo(() => 
    categories.filter(c => c.type === "income"), [categories])

  // 篩選記錄
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filterType !== "all" && record.type !== filterType) return false
      if (filterMonth && !record.date.startsWith(filterMonth)) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const categoryName = record.finance_categories?.name || record.category || ""
        return (
          categoryName.toLowerCase().includes(query) ||
          record.description?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [records, filterType, filterMonth, searchQuery])

  // 計算累計結餘
  const totalStats = useMemo(() => {
    const totalIncome = records
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    const totalExpense = records
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    return {
      totalIncome,
      totalExpense,
      totalBalance: initialBalance + totalIncome - totalExpense,
    }
  }, [records, initialBalance])

  // 計算當月統計
  const monthStats = useMemo(() => {
    const monthRecords = records.filter((r) => r.date.startsWith(filterMonth))
    const income = monthRecords
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    const expense = monthRecords
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    return { income, expense, balance: income - expense }
  }, [records, filterMonth])

  // 分類統計
  const categoryStats = useMemo(() => {
    const monthRecords = filteredRecords.filter((r) => r.type === "expense")
    const categoryMap = new Map<string, { id: string; name: string; icon: string; amount: number }>()

    monthRecords.forEach((r) => {
      const cat = r.finance_categories
      const key = cat?.id || r.category
      const current = categoryMap.get(key) || {
        id: key,
        name: cat?.name || r.category,
        icon: cat?.icon || "📦",
        amount: 0,
      }
      current.amount += Number(r.amount)
      categoryMap.set(key, current)
    })

    return Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [filteredRecords])

  // 開啟新增表單
  const openCreateForm = (type: "income" | "expense" = "expense") => {
    setEditingRecord(null)
    setRecordType(type)
    setCategoryId("")
    setAmount(null)
    setDescription("")
    setDate(new Date().toISOString().split("T")[0])
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (record: FinanceRecordWithCategory) => {
    setEditingRecord(record)
    setRecordType(record.type)
    setCategoryId(record.category_id || "")
    setAmount(Number(record.amount))
    setDescription(record.description || "")
    setDate(record.date)
    setFormOpen(true)
  }

  // 儲存記錄
  const handleSave = async () => {
    if (!categoryId || !amount || !userId) return

    setSaving(true)

    const recordData = {
      type: recordType,
      category_id: categoryId,
      // 同時更新 category 欄位以向後相容
      category: categories.find(c => c.id === categoryId)?.name || "",
      amount,
      description: description.trim() || null,
      date,
    }

    if (editingRecord) {
      await supabase
        .from("finance_records")
        .update(recordData)
        .eq("id", editingRecord.id)
    } else {
      await supabase
        .from("finance_records")
        .insert({
          ...recordData,
          user_id: userId,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchData()
  }

  // 刪除記錄
  const openDeleteDialog = (record: FinanceRecordWithCategory) => {
    setDeletingRecord(record)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingRecord) return
    setDeleteLoading(true)
    await supabase.from("finance_records").delete().eq("id", deletingRecord.id)
    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingRecord(null)
    fetchData()
  }

  // 格式化
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("zh-TW", { month: "short", day: "numeric", weekday: "short" })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-TW").format(amount)
  }

  const monthOptions = useMemo(() => {
    const options: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push(d.toISOString().slice(0, 7))
    }
    return options
  }, [])

  const formatMonthLabel = (month: string) => {
    const [year, m] = month.split("-")
    return `${year}年${parseInt(m)}月`
  }

  // 取得分類顯示資訊
  const getCategoryDisplay = (record: FinanceRecordWithCategory) => {
    const cat = record.finance_categories
    return {
      name: cat?.name || record.category || "未分類",
      icon: cat?.icon || "📦",
      color: cat?.color || "#6b7280",
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">收支記錄</h1>
          <p className="text-gray-600 mt-1">管理您的收入與支出</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/finance/budget">
            <Button variant="outline" className="gap-2">
              <PiggyBank className="w-4 h-4" />
              預算管理
            </Button>
          </Link>
          <Link href="/dashboard/finance/stats">
            <Button variant="outline" className="gap-2">
              <BarChart2 className="w-4 h-4" />
              財務統計
            </Button>
          </Link>
        </div>
      </div>

      {/* 累計結餘 */}
      <Card className={`bg-gradient-to-br ${totalStats.totalBalance >= 0 ? "from-blue-500 to-indigo-600" : "from-orange-500 to-red-600"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-80">累計結餘</p>
              <p className="text-4xl font-bold mt-1">${formatAmount(totalStats.totalBalance)}</p>
              <p className="text-sm opacity-70 mt-2">
                期初 ${formatAmount(initialBalance)} + 收入 ${formatAmount(totalStats.totalIncome)} - 支出 ${formatAmount(totalStats.totalExpense)}
              </p>
            </div>
            <Banknote className="w-16 h-16 opacity-30" />
          </div>
        </CardContent>
      </Card>

      {/* 當月統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{formatMonthLabel(filterMonth)} 收入</p>
                <p className="text-2xl font-bold text-green-600">+${formatAmount(monthStats.income)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{formatMonthLabel(filterMonth)} 支出</p>
                <p className="text-2xl font-bold text-red-600">-${formatAmount(monthStats.expense)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${monthStats.balance >= 0 ? "from-blue-50 to-indigo-50" : "from-orange-50 to-amber-50"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{formatMonthLabel(filterMonth)} 結餘</p>
                <p className={`text-2xl font-bold ${monthStats.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  ${formatAmount(monthStats.balance)}
                </p>
              </div>
              <Wallet className={`w-8 h-8 ${monthStats.balance >= 0 ? "text-blue-400" : "text-orange-400"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 預算進度 */}
      {totalBudget && (
        <Card className="col-span-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-800">本月預算</span>
              </div>
              <Link href="/dashboard/finance/budget">
                <Button variant="ghost" size="sm">
                  管理預算
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                已支出 ${monthStats.expense.toLocaleString()} / 預算 ${totalBudget.toLocaleString()}
              </span>
              <span className={`text-sm font-medium ${
                monthStats.expense > totalBudget ? "text-red-600" :
                monthStats.expense > totalBudget * 0.8 ? "text-amber-600" :
                "text-green-600"
              }`}>
                {((monthStats.expense / totalBudget) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  monthStats.expense > totalBudget ? "bg-red-500" :
                  monthStats.expense > totalBudget * 0.8 ? "bg-amber-500" :
                  "bg-green-500"
                }`}
                style={{ width: `${Math.min((monthStats.expense / totalBudget) * 100, 100)}%` }}
              />
            </div>
            
            {monthStats.expense > totalBudget && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ 已超支 ${(monthStats.expense - totalBudget).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 分類統計 */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              {formatMonthLabel(filterMonth)} 支出分類
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryStats.map((stat) => {
                const percentage = Math.round((stat.amount / monthStats.expense) * 100) || 0
                return (
                  <div key={stat.id} className="flex items-center gap-3">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-sm text-gray-700 w-16">{stat.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-600 w-20 text-right">${formatAmount(stat.amount)}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{percentage}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 篩選列 */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month}>{formatMonthLabel(month)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="income">收入</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋分類或說明..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 記錄列表 */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {records.length === 0 ? "尚無收支記錄" : "沒有符合條件的記錄"}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {records.length === 0 ? "開始記錄你的收支吧！" : "試試調整篩選條件"}
            </p>
            {records.length === 0 && (
              <Button onClick={() => openCreateForm()} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                新增記錄
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const catDisplay = getCategoryDisplay(record)
            return (
              <RecordCard
                key={record.id}
                record={record}
                categoryDisplay={catDisplay}
                onEdit={() => openEditForm(record)}
                onDelete={() => openDeleteDialog(record)}
                formatDate={formatDate}
                formatAmount={formatAmount}
              />
            )
          })}
        </div>
      )}

      {/* 新增/編輯表單 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "編輯記錄" : recordType === "income" ? "新增收入" : "新增支出"}
            </DialogTitle>
            <DialogDescription>
              記錄你的{recordType === "income" ? "收入" : "支出"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 類型切換 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={recordType === "expense" ? "default" : "outline"}
                className={recordType === "expense" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => {
                  setRecordType("expense")
                  setCategoryId("")
                }}
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                支出
              </Button>
              <Button
                type="button"
                variant={recordType === "income" ? "default" : "outline"}
                className={recordType === "income" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => {
                  setRecordType("income")
                  setCategoryId("")
                }}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                收入
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分類 *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {(recordType === "expense" ? expenseCategories : incomeCategories).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon || "📦"} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>日期</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>金額 *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={amount || ""}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>說明</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="備註說明..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button
              onClick={handleSave}
              disabled={!categoryId || !amount || saving}
              className={recordType === "income" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
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

// 記錄卡片
function RecordCard({
  record,
  categoryDisplay,
  onEdit,
  onDelete,
  formatDate,
  formatAmount,
}: {
  record: FinanceRecordWithCategory
  categoryDisplay: { name: string; icon: string; color: string }
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  formatAmount: (amount: number) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isIncome = record.type === "income"

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            isIncome ? "bg-green-100" : "bg-red-100"
          }`}>
            {categoryDisplay.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {categoryDisplay.name}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(record.date)}
              </span>
            </div>
            {record.description && (
              <p className="text-sm text-gray-600 truncate">{record.description}</p>
            )}
          </div>
          <div className={`text-lg font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}>
            {isIncome ? "+" : "-"}${formatAmount(Number(record.amount))}
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
