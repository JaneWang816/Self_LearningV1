// components/subjects/subject-form.tsx
"use client"

import { useState, useEffect } from "react"
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
import type { Subject } from "@/types/supabase"

interface SubjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; description: string }) => Promise<void>
  subject?: Subject | null  // 如果有傳入，表示是編輯模式
}

export function SubjectForm({
  open,
  onOpenChange,
  onSubmit,
  subject,
}: SubjectFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!subject

  // 編輯模式時，填入現有資料
  useEffect(() => {
    if (subject) {
      setTitle(subject.title)
      setDescription(subject.description || "")
    } else {
      setTitle("")
      setDescription("")
    }
    setError(null)
  }, [subject, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("請輸入科目名稱")
      return
    }

    setLoading(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim() })
      onOpenChange(false)
      setTitle("")
      setDescription("")
    } catch (err) {
      setError("操作失敗，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "編輯科目" : "新增科目"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "修改科目資訊" : "建立一個新的學習科目"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">科目名稱 *</Label>
              <Input
                id="title"
                placeholder="例如：數學、英文、物理"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述（選填）</Label>
              <Textarea
                id="description"
                placeholder="簡單描述這個科目的學習內容..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "處理中..." : isEdit ? "儲存變更" : "建立科目"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
