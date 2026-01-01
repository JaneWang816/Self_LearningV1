// app/(dashboard)/dashboard/journal/learning/page.tsx
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
  BookMarked,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Search,
  Clock,
  BarChart3,
} from "lucide-react"
import { updateDailyStudySummary } from "@/lib/study-stats"
import type { JournalLearning, Subject } from "@/types/custom"

// 難度標籤
const DIFFICULTY_LABELS: Record<number, string> = {
  1: "😌 很簡單",
  2: "🙂 簡單",
  3: "😐 普通",
  4: "😓 困難",
  5: "😵 很困難",
}

export default function LearningJournalPage() {
  const searchParams = useSearchParams()
  const shouldOpenNew = searchParams.get("new") === "true"

  const [journals, setJournals] = useState<JournalLearning[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSubject, setFilterSubject] = useState<string>("all")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalLearning | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState<string>("")
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<number>(3)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingJournal, setDeletingJournal] = useState<JournalLearning | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [journalsRes, subjectsRes] = await Promise.all([
      supabase
        .from("journals_learning")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("title"),
    ])

    if (journalsRes.data) setJournals(journalsRes.data)
    if (subjectsRes.data) setSubjects(subjectsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
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

    const matchesSubject =
      filterSubject === "all" || journal.subject_id === filterSubject

    return matchesSearch && matchesSubject
  })

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingJournal(null)
    setTitle("")
    setContent("")
    setSubjectId("")
    setDurationMinutes(null)
    setDifficulty(3)
    setDate(new Date().toISOString().split("T")[0])
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (journal: JournalLearning) => {
    setEditingJournal(journal)
    setTitle(journal.title || "")
    setContent(journal.content)
    setSubjectId(journal.subject_id || "")
    setDurationMinutes(journal.duration_minutes)
    setDifficulty(journal.difficulty || 3)
    setDate(journal.date)
    setFormOpen(true)
  }

  // 更新學習時間統計
  const updateStudyMinutes = async (journalDate: string, minutesDelta: number) => {
    if (minutesDelta === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 檢查是否為今天的日誌
    const today = new Date().toISOString().split("T")[0]
    if (journalDate !== today) {
      // 如果不是今天，需要手動更新該日期的記錄
      const { data: existing } = await supabase
        .from("daily_study_summary")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", journalDate)
        .single()

      if (existing) {
        const newMinutes = Math.max(0, (existing.study_minutes || 0) + minutesDelta)
        await supabase
          .from("daily_study_summary")
          .update({ 
            study_minutes: newMinutes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
      } else if (minutesDelta > 0) {
        // 建立新記錄
        await supabase
          .from("daily_study_summary")
          .insert({
            user_id: user.id,
            date: journalDate,
            flashcard_reviewed: 0,
            flashcard_correct: 0,
            question_practiced: 0,
            question_correct: 0,
            study_minutes: minutesDelta,
          })
      }
    } else {
      // 今天的記錄使用 helper function
      await updateDailyStudySummary({
        type: "study_time",
        minutes: minutesDelta,
      })
    }
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
      subject_id: subjectId || null,
      duration_minutes: durationMinutes,
      difficulty,
      date,
    }

    if (editingJournal) {
      // 編輯模式：計算時間差
      const oldMinutes = editingJournal.duration_minutes || 0
      const newMinutes = durationMinutes || 0
      const oldDate = editingJournal.date
      const newDate = date

      await supabase
        .from("journals_learning")
        .update(journalData)
        .eq("id", editingJournal.id)

      // 更新統計
      if (oldDate === newDate) {
        // 同一天，只更新差值
        const delta = newMinutes - oldMinutes
        if (delta !== 0) {
          await updateStudyMinutes(newDate, delta)
        }
      } else {
        // 不同天，舊日期扣除，新日期增加
        if (oldMinutes > 0) {
          await updateStudyMinutes(oldDate, -oldMinutes)
        }
        if (newMinutes > 0) {
          await updateStudyMinutes(newDate, newMinutes)
        }
      }
    } else {
      // 新增模式
      await supabase
        .from("journals_learning")
        .insert({
          ...journalData,
          user_id: user.id,
        })

      // 更新統計
      if (durationMinutes && durationMinutes > 0) {
        await updateStudyMinutes(date, durationMinutes)
      }
    }

    setSaving(false)
    setFormOpen(false)
    fetchData()
  }

  // 開啟刪除確認
  const openDeleteDialog = (journal: JournalLearning) => {
    setDeletingJournal(journal)
    setDeleteDialogOpen(true)
  }

  // 刪除日誌
  const handleDelete = async () => {
    if (!deletingJournal) return

    setDeleteLoading(true)

    // 先扣除統計
    if (deletingJournal.duration_minutes && deletingJournal.duration_minutes > 0) {
      await updateStudyMinutes(deletingJournal.date, -deletingJournal.duration_minutes)
    }

    await supabase
      .from("journals_learning")
      .delete()
      .eq("id", deletingJournal.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingJournal(null)
    fetchData()
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

  // 取得科目名稱
  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return null
    return subjects.find((s) => s.id === subjectId)?.title || null
  }

  // 格式化時長
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} 分鐘`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
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
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">學習日誌</h1>
            <p className="text-gray-500">記錄學習內容與心得</p>
          </div>
        </div>
        <Button onClick={openCreateForm} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          新增
        </Button>
      </div>

      {/* 篩選區 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜尋日誌..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="全部科目" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部科目</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 日誌列表 */}
      {filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookMarked className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchQuery || filterSubject !== "all"
                ? "沒有符合條件的日誌"
                : "還沒有學習日誌"}
            </p>
            {!searchQuery && filterSubject === "all" && (
              <Button onClick={openCreateForm} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                新增第一篇
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
              subjectName={getSubjectName(journal.subject_id)}
              onEdit={() => openEditForm(journal)}
              onDelete={() => openDeleteDialog(journal)}
              formatDate={formatDate}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingJournal ? "編輯日誌" : "新增學習日誌"}
            </DialogTitle>
            <DialogDescription>
              記錄今天的學習內容與心得
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
                <Label>科目</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不指定</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>學習時長（分鐘）</Label>
                <Input
                  type="number"
                  min="1"
                  value={durationMinutes || ""}
                  onChange={(e) =>
                    setDurationMinutes(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="例如：60"
                />
              </div>
              <div className="space-y-2">
                <Label>難度感受</Label>
                <Select
                  value={difficulty.toString()}
                  onValueChange={(v) => setDifficulty(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
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
                placeholder="例如：複習三角函數"
              />
            </div>

            <div className="space-y-2">
              <Label>內容 *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="今天學了什麼？有什麼收穫或困難？"
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
              className="bg-green-600 hover:bg-green-700"
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
  subjectName,
  onEdit,
  onDelete,
  formatDate,
  formatDuration,
}: {
  journal: JournalLearning
  subjectName: string | null
  onEdit: () => void
  onDelete: () => void
  formatDate: (date: string) => string
  formatDuration: (minutes: number | null) => string | null
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 圖示 */}
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
            <BookMarked className="w-5 h-5 text-green-600" />
          </div>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(journal.date)}
              </span>
              {subjectName && (
                <span className="text-xs px-2 py-0.5 bg-green-100 rounded text-green-700">
                  {subjectName}
                </span>
              )}
              {journal.duration_minutes && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(journal.duration_minutes)}
                </span>
              )}
              {journal.difficulty && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {DIFFICULTY_LABELS[journal.difficulty]}
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
