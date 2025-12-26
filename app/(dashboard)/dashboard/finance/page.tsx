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
} from "lucide-react"
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/types/custom"
import type { FinanceRecord } from "@/types/custom"

// 分類圖示
const categoryIcons: Record<string, string> = {
  // 支出
  飲食: "🍜",
  交通: "🚌",
  娛樂: "🎮",
  購物: "🛒",
  學習: "📚",
  // 收入
  零用錢: "💵",
  獎學金: "🏆",
  打工: "💼",
  禮金: "🎁",
  // 通用
  其他: "📦",
}

export default function FinancePage() {
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選
  const [filterType, setFilterType] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  )
  const [searchQuery, setSearchQuery] = useState("")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)
  const [recordType, setRecordType] = useState<"income" | "expense">("expense")
  const [category, setCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [amount, setAmount] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("finance_records")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (data) setRecords(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // 取得所有使用過的分類（用於自訂分類建議）
  const usedCategories = useMemo(() => {
    const expenseSet = new Set<string>(EXPENSE_CATEGORIES)
    const incomeSet = new Set<string>(INCOME_CATEGORIES)
    
    records.forEach((r) => {
      if (r.type === "expense") {
        expenseSet.add(r.category)
      } else {
        incomeSet.add(r.category)
      }
    })

    return {
      expense: Array.from(expenseSet),
      income: Array.from(incomeSet),
    }
  }, [records])

  // 篩選記錄
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 類型篩選
      if (filterType !== "all" && record.type !== filterType) return false

      // 月份篩選
      if (filterMonth && !record.date.startsWith(filterMonth)) return false

      // 搜尋
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          record.category.toLowerCase().includes(query) ||
          record.description?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [records, filterType, filterMonth, searchQuery])

  // 計算統計
  const stats = useMemo(() => {
    const monthRecords = records.filter((r) => r.date.startsWith(filterMonth))
    
    const income = monthRecords
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    
    const expense = monthRecords
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + Number(r.amount), 0)

    return {
      income,
      expense,
      balance: income - expense,
    }
  }, [records, filterMonth])

  // 分類統計
  const categoryStats = useMemo(() => {
    const monthRecords = filteredRecords.filter((r) => r.type === "expense")
    const categoryMap = new Map<string, number>()

    monthRecords.forEach((r) => {
      const current = categoryMap.get(r.category) || 0
      categoryMap.set(r.category, current + Number(r.amount))
    })

    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredRecords])

  // 開啟新增表單
  const openCreateForm = (type: "income" | "expense" = "expense") => {
    setEditingRecord(null)
    setRecordType(type)
    setCategory("")
    setCustomCategory("")
    setAmount(null)
    setDescription("")
    setDate(new Date().toISOString().split("T")[0])
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (record: FinanceRecord) => {
    setEditingRecord(record)
    setRecordType(record.type as "income" | "expense")
    
    // 檢查是否為預設分類
    const defaultCategories = record.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    if (defaultCategories.includes(record.category as any)) {
      setCategory(record.category)
      setCustomCategory("")
    } else {
      setCategory("custom")
      setCustomCategory(record.category)
    }
    
    setAmount(Number(record.amount))
    setDescription(record.description || "")
    setDate(record.date)
    setFormOpen(true)
  }

  // 儲存記錄
  const handleSave = async () => {
    const finalCategory = category === "custom" ? customCategory.trim() : category
    if (!finalCategory || !amount) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const recordData = {
      type: recordType,
      category: finalCategory,
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
          user_id: user.id,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchRecords()
  }

  // 開啟刪除確認
  const openDeleteDialog = (record: FinanceRecord) => {
    setDeletingRecord(record)
    setDeleteDialogOpen(true)
  }

  // 刪除記錄
  const handleDelete = async () => {
    if (!deletingRecord) return

    setDeleteLoading(true)

    await supabase
      .from("finance_records")
      .delete()
      .eq("id", deletingRecord.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingRecord(null)
    fetchRecords()
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
      weekday: "short",
    })
  }

  // 格式化金額
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-TW").format(amount)
  }

  // 月份選項
  const monthOptions = useMemo(() => {
    const options: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push(date.toISOString().slice(0, 7))
    }
    return options
  }, [])

  const formatMonthLabel = (month: string) => {
    const [year, m] = month.split("-")
    return `${year}年${parseInt(m)}月`
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
          <p className="text-gray-600 mt-1">管理你的收入與支出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreateForm("income")}>
            <ArrowUpCircle className="w-4 h-4 mr-2 text-green-600" />
            收入
          </Button>
          <Button onClick={() => openCreateForm("expense")} className="bg-amber-600 hover:bg-amber-700">
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            支出
          </Button>
        </div>
      </div>

      {/* 月份統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">收入</p>
                <p className="text-2xl font-bold text-green-600">
                  +${formatAmount(stats.income)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">支出</p>
                <p className="text-2xl font-bold text-red-600">
                  -${formatAmount(stats.expense)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.balance >= 0 ? "from-blue-50 to-indigo-50" : "from-orange-50 to-amber-50"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">結餘</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  ${formatAmount(stats.balance)}
                </p>
              </div>
              <Wallet className={`w-8 h-8 ${stats.balance >= 0 ? "text-blue-400" : "text-orange-400"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 支出分類統計 */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              本月支出分類
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryStats.map(([cat, amt]) => {
                const percentage = Math.round((amt / stats.expense) * 100)
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-lg">{categoryIcons[cat] || "📦"}</span>
                    <span className="text-sm text-gray-700 w-16">{cat}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-20 text-right">
                      ${formatAmount(amt)}
                    </span>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {percentage}%
                    </span>
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
              <SelectItem key={month} value={month}>
                {formatMonthLabel(month)}
              </SelectItem>
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
          {filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onEdit={() => openEditForm(record)}
              onDelete={() => openDeleteDialog(record)}
              formatDate={formatDate}
              formatAmount={formatAmount}
            />
          ))}
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
                  setCategory("")
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
                  setCategory("")
                }}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                收入
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分類 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {(recordType === "expense" ? usedCategories.expense : usedCategories.income).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryIcons[cat] || "📦"} {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">✏️ 自訂分類</SelectItem>
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

            {category === "custom" && (
              <div className="space-y-2">
                <Label>自訂分類名稱 *</Label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="輸入分類名稱"
                />
              </div>
            )}

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
              disabled={!(category === "custom" ? customCategory.trim() : category) || !amount || saving}
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
  onEdit,
  onDelete,
  formatDate,
  formatAmount,
}: {
  record: FinanceRecord
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  formatAmount: (amount: number) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isIncome = record.type === "income"
  const icon = categoryIcons[record.category] || "📦"

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            isIncome ? "bg-green-100" : "bg-red-100"
          }`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {record.category}
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
