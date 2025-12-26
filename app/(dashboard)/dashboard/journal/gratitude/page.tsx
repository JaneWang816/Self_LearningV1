// app/(dashboard)/dashboard/journal/gratitude/page.tsx
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
  ArrowLeft,
  Plus,
  Heart,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Search,
  Sparkles,
} from "lucide-react"
import type { JournalGratitude } from "@/types/custom"

// 感恩提示語
const GRATITUDE_PROMPTS = [
  "今天有什麼讓你感到開心的事？",
  "今天有誰幫助了你？",
  "你今天學到了什麼新東西？",
  "今天有什麼小確幸？",
  "你最感謝生活中的什麼？",
  "今天有什麼事讓你感動？",
  "你感謝自己的什麼特質？",
  "今天的天氣或環境有什麼讓你欣賞的地方？",
]

export default function GratitudeJournalPage() {
  const searchParams = useSearchParams()
  const shouldOpenNew = searchParams.get("new") === "true"

  const [journals, setJournals] = useState<JournalGratitude[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選
  const [searchQuery, setSearchQuery] = useState("")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalGratitude | null>(null)
  const [content, setContent] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState("")

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingJournal, setDeletingJournal] = useState<JournalGratitude | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchJournals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("journals_gratitude")
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
    return (
      searchQuery === "" ||
      journal.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // 取得隨機提示語
  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * GRATITUDE_PROMPTS.length)
    return GRATITUDE_PROMPTS[randomIndex]
  }

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingJournal(null)
    setContent("")
    setDate(new Date().toISOString().split("T")[0])
    setCurrentPrompt(getRandomPrompt())
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (journal: JournalGratitude) => {
    setEditingJournal(journal)
    setContent(journal.content)
    setDate(journal.date)
    setCurrentPrompt("")
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
      content: content.trim(),
      date,
    }

    if (editingJournal) {
      await supabase
        .from("journals_gratitude")
        .update(journalData)
        .eq("id", editingJournal.id)
    } else {
      await supabase
        .from("journals_gratitude")
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
  const openDeleteDialog = (journal: JournalGratitude) => {
    setDeletingJournal(journal)
    setDeleteDialogOpen(true)
  }

  // 刪除日誌
  const handleDelete = async () => {
    if (!deletingJournal) return

    setDeleteLoading(true)

    await supabase
      .from("journals_gratitude")
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

  // 換一個提示
  const shufflePrompt = () => {
    setCurrentPrompt(getRandomPrompt())
  }

  // 計算連續紀錄天數
  const getStreak = () => {
    if (journals.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    const sortedDates = Array.from(new Set(journals.map((j) => j.date))).sort(      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    for (let i = 0; i < sortedDates.length; i++) {
      const journalDate = new Date(sortedDates[i])
      journalDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (journalDate.getTime() === expectedDate.getTime()) {
        streak++
      } else if (i === 0 && journalDate.getTime() === expectedDate.getTime() - 86400000) {
        // 如果今天還沒寫，但昨天有寫
        continue
      } else {
        break
      }
    }

    return streak
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const streak = getStreak()

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
            <h1 className="text-2xl font-bold text-gray-800">感恩日誌</h1>
            <p className="text-gray-600 mt-1">感謝生活中的美好</p>
          </div>
        </div>
        <Button
          onClick={openCreateForm}
          className="bg-pink-600 hover:bg-pink-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增日誌
        </Button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-pink-600">{journals.length}</p>
            <p className="text-sm text-gray-600">感恩紀錄</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {streak > 0 ? `🔥 ${streak}` : "0"}
            </p>
            <p className="text-sm text-gray-600">連續天數</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 md:col-span-1 col-span-2">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">今日提醒</p>
            <p className="text-purple-700 font-medium">
              每天記錄三件感恩的事，能讓生活更快樂 ✨
            </p>
          </CardContent>
        </Card>
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
      </div>

      {/* 日誌列表 */}
      {filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {journals.length === 0 ? "開始記錄感恩的事吧！" : "沒有符合條件的日誌"}
            </h3>
            <p className="text-gray-600 text-center mb-4 max-w-md">
              {journals.length === 0
                ? "每天花幾分鐘，寫下讓你感謝的人事物，培養正向思維。"
                : "試試調整搜尋條件"}
            </p>
            {journals.length === 0 && (
              <Button
                onClick={openCreateForm}
                className="bg-pink-600 hover:bg-pink-700"
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
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              {editingJournal ? "編輯日誌" : "新增感恩日誌"}
            </DialogTitle>
            <DialogDescription>
              寫下今天讓你感謝的事
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 提示語 */}
            {!editingJournal && currentPrompt && (
              <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <p className="text-pink-700">{currentPrompt}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shufflePrompt}
                    className="text-pink-600 hover:text-pink-700 shrink-0"
                  >
                    換一個
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>日期</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>感恩的事 *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="今天我感謝..."
                rows={6}
              />
              <p className="text-xs text-gray-500">
                可以寫多件事，一件一行
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="bg-pink-600 hover:bg-pink-700"
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
  journal: JournalGratitude
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
}) {
  const [showMenu, setShowMenu] = useState(false)

  // 分行顯示
  const lines = journal.content.split("\n").filter((line) => line.trim())

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 愛心圖示 */}
          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-pink-600 fill-pink-200" />
          </div>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(journal.date)}
              </span>
            </div>

            <div className="space-y-1">
              {lines.map((line, index) => (
                <p key={index} className="text-gray-700 flex items-start gap-2">
                  <span className="text-pink-400">♡</span>
                  {line}
                </p>
              ))}
            </div>
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
