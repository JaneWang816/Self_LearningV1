// app/(dashboard)/dashboard/finance/categories/page.tsx
"use client"

import { useState, useEffect } from "react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  GripVertical,
  Lock,
} from "lucide-react"
import Link from "next/link"

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

// 可用的圖示
const AVAILABLE_ICONS = [
  "🍜", "🍔", "☕", "🍰",  // 飲食
  "🚌", "🚗", "✈️", "🚇",  // 交通
  "🎮", "🎬", "🎵", "🎨",  // 娛樂
  "🛒", "👕", "💄", "📱",  // 購物
  "📚", "✏️", "💻", "🎓",  // 學習
  "💵", "🏆", "💼", "🎁",  // 收入
  "💊", "🏥", "🏠", "📦",  // 其他
]

// 可用的顏色
const AVAILABLE_COLORS = [
  { name: "紅色", value: "#ef4444" },
  { name: "橘色", value: "#f97316" },
  { name: "黃色", value: "#eab308" },
  { name: "綠色", value: "#22c55e" },
  { name: "藍色", value: "#3b82f6" },
  { name: "紫色", value: "#8b5cf6" },
  { name: "粉色", value: "#ec4899" },
  { name: "灰色", value: "#6b7280" },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryIcon, setCategoryIcon] = useState("📦")
  const [categoryColor, setCategoryColor] = useState("#6b7280")
  const [categoryType, setCategoryType] = useState<"income" | "expense">("expense")
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<FinanceCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入分類
  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    // 分開查詢
    const [userCategoriesRes, defaultCategoriesRes] = await Promise.all([
      supabase
        .from("finance_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("finance_categories")
        .select("*")
        .is("user_id", null)
        .order("sort_order", { ascending: true }),
    ])

    const allCategories = [
      ...(defaultCategoriesRes.data || []),
      ...(userCategoriesRes.data || []),
    ] as FinanceCategory[]

    setCategories(allCategories)
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 依類型分類
  const expenseCategories = categories.filter(c => c.type === "expense")
  const incomeCategories = categories.filter(c => c.type === "income")

  // 開啟新增表單
  const openCreateForm = (type: "income" | "expense") => {
    setEditingCategory(null)
    setCategoryType(type)
    setCategoryName("")
    setCategoryIcon("📦")
    setCategoryColor("#6b7280")
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (category: FinanceCategory) => {
    if (category.is_default) return // 不能編輯預設分類
    setEditingCategory(category)
    setCategoryType(category.type)
    setCategoryName(category.name)
    setCategoryIcon(category.icon || "📦")
    setCategoryColor(category.color || "#6b7280")
    setFormOpen(true)
  }

  // 儲存分類
  const handleSave = async () => {
    if (!categoryName.trim() || !userId) return

    setSaving(true)

    const categoryData = {
      name: categoryName.trim(),
      icon: categoryIcon,
      color: categoryColor,
      type: categoryType,
    }

    if (editingCategory) {
      await supabase
        .from("finance_categories")
        .update(categoryData)
        .eq("id", editingCategory.id)
    } else {
      // 取得最大 sort_order
      const maxOrder = categories
        .filter(c => c.type === categoryType)
        .reduce((max, c) => Math.max(max, c.sort_order), 0)

      await supabase
        .from("finance_categories")
        .insert({
          ...categoryData,
          user_id: userId,
          sort_order: maxOrder + 1,
          is_default: false,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchCategories()
  }

  // 刪除分類
  const openDeleteDialog = (category: FinanceCategory) => {
    if (category.is_default) return
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setDeleteLoading(true)

    await supabase
      .from("finance_categories")
      .delete()
      .eq("id", deletingCategory.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingCategory(null)
    fetchCategories()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">分類管理</h1>
          <p className="text-gray-600 mt-1">管理收入與支出的分類</p>
        </div>
      </div>

      {/* 分頁 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expense" | "income")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="expense" className="gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              支出分類
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              收入分類
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => openCreateForm(activeTab)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            新增分類
          </Button>
        </div>

        {/* 支出分類 */}
        <TabsContent value="expense" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">支出分類</CardTitle>
              <CardDescription>共 {expenseCategories.length} 個分類</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenseCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onEdit={() => openEditForm(category)}
                    onDelete={() => openDeleteDialog(category)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 收入分類 */}
        <TabsContent value="income" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">收入分類</CardTitle>
              <CardDescription>共 {incomeCategories.length} 個分類</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incomeCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onEdit={() => openEditForm(category)}
                    onDelete={() => openDeleteDialog(category)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增/編輯表單 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "編輯分類" : "新增分類"}
            </DialogTitle>
            <DialogDescription>
              {categoryType === "expense" ? "支出" : "收入"}分類
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分類名稱 *</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="輸入分類名稱"
              />
            </div>

            <div className="space-y-2">
              <Label>圖示</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setCategoryIcon(icon)}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                      categoryIcon === icon
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>顏色</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setCategoryColor(color.value)}
                    className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                      categoryColor === color.value
                        ? "border-gray-800 ring-2 ring-offset-2 ring-gray-400"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* 預覽 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">預覽</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  {categoryIcon}
                </div>
                <span className="font-medium">{categoryName || "分類名稱"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button
              onClick={handleSave}
              disabled={!categoryName.trim() || saving}
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
            <AlertDialogTitle>確定要刪除「{deletingCategory?.name}」嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後，使用此分類的記錄將顯示為「未分類」。此操作無法復原。
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

// 分類項目元件
function CategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: FinanceCategory
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
      <div className="text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: `${category.color || "#6b7280"}20` }}
      >
        {category.icon || "📦"}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{category.name}</span>
          {category.is_default && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />
              預設
            </span>
          )}
        </div>
      </div>
      {!category.is_default && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
