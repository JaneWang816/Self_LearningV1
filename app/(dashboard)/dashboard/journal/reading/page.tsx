// app/(dashboard)/dashboard/journal/reading/page.tsx
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
import { Checkbox } from "@/components/ui/checkbox"
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
  BookOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Search,
  Star,
  BookCheck,
  User,
} from "lucide-react"
import type { JournalReading } from "@/types/custom"

// 評分標籤
const RATING_LABELS: Record<number, string> = {
  1: "⭐ 不推薦",
  2: "⭐⭐ 普通",
  3: "⭐⭐⭐ 還不錯",
  4: "⭐⭐⭐⭐ 推薦",
  5: "⭐⭐⭐⭐⭐ 強烈推薦",
}

export default function ReadingJournalPage() {
  const searchParams = useSearchParams()
  const shouldOpenNew = searchParams.get("new") === "true"

  const [journals, setJournals] = useState<JournalReading[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalReading | null>(null)
  const [bookTitle, setBookTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [content, setContent] = useState("")
  const [pagesRead, setPagesRead] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingJournal, setDeletingJournal] = useState<JournalReading | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchJournals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("journals_reading")
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
      journal.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.content?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "finished" && journal.is_finished) ||
      (filterStatus === "reading" && !journal.is_finished)

    return matchesSearch && matchesStatus
  })

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingJournal(null)
    setBookTitle("")
    setAuthor("")
    setContent("")
    setPagesRead(null)
    setCurrentPage(null)
    setTotalPages(null)
    setRating(null)
    setIsFinished(false)
    setDate(new Date().toISOString().split("T")[0])
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (journal: JournalReading) => {
    setEditingJournal(journal)
    setBookTitle(journal.book_title)
    setAuthor(journal.author || "")
    setContent(journal.content || "")
    setPagesRead(journal.pages_read)
    setCurrentPage(journal.current_page)
    setTotalPages(journal.total_pages)
    setRating(journal.rating)
    setIsFinished(journal.is_finished ?? false)
    setDate(journal.date)
    setFormOpen(true)
  }

  // 儲存日誌
  const handleSave = async () => {
    if (!bookTitle.trim()) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const journalData = {
      book_title: bookTitle.trim(),
      author: author.trim() || null,
      content: content.trim() || null,
      pages_read: pagesRead,
      current_page: currentPage,
      total_pages: totalPages,
      rating: isFinished ? rating : null,
      is_finished: isFinished,
      date,
    }

    if (editingJournal) {
      await supabase
        .from("journals_reading")
        .update(journalData)
        .eq("id", editingJournal.id)
    } else {
      await supabase
        .from("journals_reading")
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
  const openDeleteDialog = (journal: JournalReading) => {
    setDeletingJournal(journal)
    setDeleteDialogOpen(true)
  }

  // 刪除日誌
  const handleDelete = async () => {
    if (!deletingJournal) return

    setDeleteLoading(true)

    await supabase
      .from("journals_reading")
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
    })
  }

  // 計算閱讀進度
  const getProgress = (current: number | null, total: number | null) => {
    if (!current || !total || total === 0) return null
    return Math.round((current / total) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 統計
  const finishedCount = journals.filter((j) => j.is_finished).length
  const readingCount = journals.filter((j) => !j.is_finished).length

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
            <h1 className="text-2xl font-bold text-gray-800">閱讀日誌</h1>
            <p className="text-gray-600 mt-1">記錄閱讀書籍與感想</p>
          </div>
        </div>
        <Button
          onClick={openCreateForm}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增日誌
        </Button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{journals.length}</p>
            <p className="text-sm text-gray-500">總紀錄</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{finishedCount}</p>
            <p className="text-sm text-gray-500">已讀完</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{readingCount}</p>
            <p className="text-sm text-gray-500">閱讀中</p>
          </CardContent>
        </Card>
      </div>

      {/* 篩選列 */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋書名、作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="所有狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有狀態</SelectItem>
            <SelectItem value="reading">閱讀中</SelectItem>
            <SelectItem value="finished">已讀完</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 日誌列表 */}
      {filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {journals.length === 0 ? "尚未建立閱讀日誌" : "沒有符合條件的日誌"}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {journals.length === 0
                ? "開始記錄你的閱讀歷程吧！"
                : "試試調整篩選條件"}
            </p>
            {journals.length === 0 && (
              <Button
                onClick={openCreateForm}
                className="bg-purple-600 hover:bg-purple-700"
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
              getProgress={getProgress}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingJournal ? "編輯日誌" : "新增閱讀日誌"}
            </DialogTitle>
            <DialogDescription>
              記錄你正在閱讀或已讀完的書籍
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>書名 *</Label>
              <Input
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="例如：原子習慣"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>作者</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="例如：James Clear"
                />
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>總頁數</Label>
                <Input
                  type="number"
                  min="1"
                  value={totalPages || ""}
                  onChange={(e) =>
                    setTotalPages(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="例如：300"
                />
              </div>
              <div className="space-y-2">
                <Label>目前頁數</Label>
                <Input
                  type="number"
                  min="0"
                  value={currentPage || ""}
                  onChange={(e) =>
                    setCurrentPage(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="例如：150"
                />
              </div>
              <div className="space-y-2">
                <Label>今日閱讀</Label>
                <Input
                  type="number"
                  min="0"
                  value={pagesRead || ""}
                  onChange={(e) =>
                    setPagesRead(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="頁數"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="finished"
                checked={isFinished}
                onCheckedChange={(checked) => setIsFinished(checked as boolean)}
              />
              <Label htmlFor="finished" className="cursor-pointer">
                已讀完這本書
              </Label>
            </div>

            {isFinished && (
              <div className="space-y-2">
                <Label>評分</Label>
                <Select
                  value={rating?.toString() || ""}
                  onValueChange={(v) => setRating(v ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇評分" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RATING_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>心得 / 筆記</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="記錄閱讀心得、重點摘要或感想..."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!bookTitle.trim() || saving}
              className="bg-purple-600 hover:bg-purple-700"
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
  getProgress,
}: {
  journal: JournalReading
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  getProgress: (current: number | null, total: number | null) => number | null
}) {
  const [showMenu, setShowMenu] = useState(false)
  const progress = getProgress(journal.current_page, journal.total_pages)

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 圖示 */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            journal.is_finished ? "bg-green-100" : "bg-purple-100"
          }`}>
            {journal.is_finished ? (
              <BookCheck className="w-5 h-5 text-green-600" />
            ) : (
              <BookOpen className="w-5 h-5 text-purple-600" />
            )}
          </div>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-800">
                {journal.book_title}
              </h3>
              {journal.is_finished && (
                <span className="text-xs px-2 py-0.5 bg-green-100 rounded text-green-700">
                  已讀完
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 mb-2 flex-wrap">
              {journal.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {journal.author}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(journal.date)}
              </span>
              {journal.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  {journal.rating}/5
                </span>
              )}
            </div>

            {/* 進度條 */}
            {progress !== null && !journal.is_finished && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>閱讀進度</span>
                  <span>{progress}% ({journal.current_page}/{journal.total_pages}頁)</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {journal.content && (
              <p className="text-gray-700 whitespace-pre-wrap line-clamp-2">
                {journal.content}
              </p>
            )}
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
