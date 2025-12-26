// app/(dashboard)/dashboard/journal/life/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  ArrowLeft,
  Plus,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Search,
} from "lucide-react"
import { MOOD_LABELS } from "@/types/custom"
import type { JournalLife } from "@/types/custom"

export default function LifeJournalPage() {
  const searchParams = useSearchParams()
  const shouldOpenNew = searchParams.get("new") === "true"

  const [journals, setJournals] = useState<JournalLife[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMood, setFilterMood] = useState<string>("all")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalLife | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [mood, setMood] = useState<number>(3)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingJournal, setDeletingJournal] = useState<JournalLife | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchJournals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("journals_life")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (data) setJournals(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchJournals()
  }, [])

  // 自動開啟新增表單
  useEffect(() => {
    if (shouldOpenNew && !loading) {
      openCreateForm()
    }
  }, [shouldOpenNew, loading])

  // 篩選日誌
  const filteredJournals = journals.filter((journal) => {
    const matchesSearch =
      searchQuery === "" ||
      journal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMood =
      filterMood === "all" || journal.mood?.toString() === filterMood

    return matchesSearch && matchesMood
  })

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingJournal(null)
    setTitle("")
    setContent("")
    setMood(3)
    setDate(new Date().toISOString().split("T")[0])
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (journal: JournalLife) => {
    setEditingJournal(journal)
    setTitle(journal.title || "")
    setContent(journal.content)
    setMood(journal.mood || 3)
    setDate(journal.date)
    setFormOpen(true)
  }

  // 儲存日誌
  const handleSave = async () => {
    if (!content.trim()) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const journalData = {
      title: title.trim() || null,
      content: content.trim(),
      mood,
      date,
    }

    if (editingJournal) {
      await supabase
        .from("journals_life")
        .update(journalData)
        .eq("id", editingJournal.id)
    } else {
      await supabase
        .from("journals_life")
        .insert({
          ...journalData,
          user_id: user.id,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchJournals()
  }

  // 開啟刪除確認
  const openDeleteDialog = (journal: JournalLife) => {
    setDeletingJournal(journal)
    setDeleteDialogOpen(true)
  }

  // 刪除日誌
  const handleDelete = async () => {
    if (!deletingJournal) return

    setDeleteLoading(true)

    await supabase
      .from("journals_life")
      .delete()
      .eq("id", deletingJournal.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingJournal(null)
    fetchJournals()
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
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
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/journal">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">生活日誌</h1>
            <p className="text-gray-600 mt-1">記錄日常生活點滴</p>
          </div>
        </div>
        <Button
          onClick={openCreateForm}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增日誌
        </Button>
      </div>

      {/* 篩選列 */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋日誌..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterMood} onValueChange={setFilterMood}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="所有心情" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有心情</SelectItem>
            {Object.entries(MOOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 日誌列表 */}
      {filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {journals.length === 0 ? "尚未建立生活日誌" : "沒有符合條件的日誌"}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {journals.length === 0
                ? "開始記錄你的日常生活吧！"
                : "試試調整篩選條件"}
            </p>
            {journals.length === 0 && (
              <Button
                onClick={openCreateForm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增日誌
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJournals.map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              onEdit={() => openEditForm(journal)}
              onDelete={() => openDeleteDialog(journal)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingJournal ? "編輯日誌" : "新增生活日誌"}
            </DialogTitle>
            <DialogDescription>
              記錄今天的生活點滴
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>今日心情</Label>
                <Select
                  value={mood.toString()}
                  onValueChange={(v) => setMood(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>標題（選填）</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：充實的一天"
              />
            </div>

            <div className="space-y-2">
              <Label>內容 *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="今天發生了什麼事？有什麼想法或感受？"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
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
    </div>
  )
}

// 日誌卡片元件
function JournalCard({
  journal,
  onEdit,
  onDelete,
  formatDate,
}: {
  journal: JournalLife
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 心情圖示 */}
          <div className="text-3xl shrink-0">
            {journal.mood ? MOOD_LABELS[journal.mood]?.split(" ")[0] : "😐"}
          </div>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(journal.date)}
              </span>
              {journal.mood && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                  {MOOD_LABELS[journal.mood]}
                </span>
              )}
            </div>
            {journal.title && (
              <h3 className="font-semibold text-gray-800 mb-1">
                {journal.title}
              </h3>
            )}
            <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
              {journal.content}
            </p>
          </div>

          {/* 選單 */}
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
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-md shadow-lg border py-1">
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setShowMenu(false)
                      onEdit()
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    編輯
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowMenu(false)
                      onDelete()
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    刪除
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
