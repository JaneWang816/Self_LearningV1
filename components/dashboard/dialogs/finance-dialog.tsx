// components/dashboard/dialogs/finance-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"

interface FinanceCategory {
  id: string
  name: string
  type: "income" | "expense"
  icon: string | null
  is_default: boolean
}

interface FinanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: Record<string, any>
  setFormData: (data: Record<string, any>) => void
  onSave: () => void
  saving: boolean
  dateLabel: string
  isEdit: boolean
}

// 預設分類（fallback）
const DEFAULT_EXPENSE_CATEGORIES = ["飲食", "交通", "娛樂", "購物", "學習", "其他"]
const DEFAULT_INCOME_CATEGORIES = ["零用錢", "獎學金", "打工", "禮金", "其他"]

export function FinanceDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSave,
  saving,
  dateLabel,
  isEdit,
}: FinanceDialogProps) {
  const [expenseCategories, setExpenseCategories] = useState<FinanceCategory[]>([])
  const [incomeCategories, setIncomeCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(false)

  // 載入分類（預設 + 自訂）
  useEffect(() => {
    const loadCategories = async () => {
      if (!open) return
      
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // 分開查詢：預設分類和用戶分類
      const [defaultRes, userRes] = await Promise.all([
        supabase
          .from("finance_categories")
          .select("*")
          .is("user_id", null)
          .order("sort_order", { ascending: true }),
        supabase
          .from("finance_categories")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
      ])

      // 合併分類
      const allCategories = [
        ...(defaultRes.data || []),
        ...(userRes.data || []),
      ] as FinanceCategory[]

      if (allCategories.length > 0) {
        const expense = allCategories.filter(c => c.type === "expense")
        const income = allCategories.filter(c => c.type === "income")
        setExpenseCategories(expense)
        setIncomeCategories(income)
      } else {
        // Fallback 到硬編碼的預設分類
        setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({
          id: `default-expense-${i}`,
          name,
          type: "expense" as const,
          icon: null,
          is_default: true,
        })))
        setIncomeCategories(DEFAULT_INCOME_CATEGORIES.map((name, i) => ({
          id: `default-income-${i}`,
          name,
          type: "income" as const,
          icon: null,
          is_default: true,
        })))
      }
      
      setLoading(false)
    }

    loadCategories()
  }, [open])

  const categories = formData.type === "income" ? incomeCategories : expenseCategories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯收支" : "新增收支"}</DialogTitle>
          <DialogDescription>{dateLabel} 的記錄</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>類型</Label>
            <Select 
              value={formData.type || "expense"} 
              onValueChange={(v) => setFormData({ ...formData, type: v, category: "" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">支出</SelectItem>
                <SelectItem value="income">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>分類 *</Label>
            <Select 
              value={formData.category || ""} 
              onValueChange={(v) => setFormData({ ...formData, category: v })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "載入中..." : "選擇分類"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.icon || "📦"} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>金額 *</Label>
            <Input 
              type="number" 
              value={formData.amount || ""} 
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label>備註</Label>
            <Input 
              value={formData.description || ""} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button 
            onClick={onSave} 
            disabled={saving || !formData.category || !formData.amount || loading}
          >
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
