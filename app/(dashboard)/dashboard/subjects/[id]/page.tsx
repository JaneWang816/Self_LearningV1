// app/(dashboard)/dashboard/subjects/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeft, Plus, FolderOpen, MoreVertical, Pencil, Trash2 } from "lucide-react"
import type { Subject, Topic } from "@/types/supabase"

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicTitle, setTopicTitle] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // 刪除相關 state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入科目和主題
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得科目
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .eq("user_id", user.id)
      .single()

    if (!subjectData) {
      router.push("/dashboard/subjects")
      return
    }
    setSubject(subjectData)

    // 取得主題列表
    const { data: topicsData } = await supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .order("order", { ascending: true })

    if (topicsData) {
      setTopics(topicsData)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [subjectId])

  // 開啟新增/編輯表單
  const openForm = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic)
      setTopicTitle(topic.title)
    } else {
      setEditingTopic(null)
      setTopicTitle("")
    }
    setFormError(null)
    setFormOpen(true)
  }

  // 關閉表單
  const closeForm = () => {
    setFormOpen(false)
    setEditingTopic(null)
    setTopicTitle("")
    setFormError(null)
  }

  // 新增/編輯主題
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicTitle.trim()) {
      setFormError("請輸入主題名稱")
      return
    }

    setFormLoading(true)
    setFormError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("未登入")

      if (editingTopic) {
        // 編輯
        const { error } = await supabase
          .from("topics")
          .update({ title: topicTitle.trim() })
          .eq("id", editingTopic.id)

        if (error) throw error
      } else {
        // 新增
        const { error } = await supabase.from("topics").insert({
          subject_id: subjectId,
          user_id: user.id,
          title: topicTitle.trim(),
          order: topics.length,
        })

        if (error) throw error
      }

      closeForm()
      await fetchData()
    } catch (err) {
      setFormError("操作失敗，請稍後再試")
    } finally {
      setFormLoading(false)
    }
  }

  // 開啟刪除確認
  const openDeleteDialog = (topic: Topic) => {
    setDeletingTopic(topic)
    setDeleteDialogOpen(true)
  }

  // 刪除主題
  const handleDelete = async () => {
    if (!deletingTopic) return

    setDeleteLoading(true)
    const { error } = await supabase.from("topics").delete().eq("id", deletingTopic.id)
    
    if (!error) {
      await fetchData()
    }
    
    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingTopic(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!subject) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/subjects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{subject.title}</h1>
            <p className="text-gray-600 mt-1">
              {subject.description || "管理此科目的主題與章節"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增主題
        </Button>
      </div>

      {/* 主題列表 */}
      {topics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              尚未建立主題
            </h3>
            <p className="text-gray-600 text-center mb-4">
              為「{subject.title}」建立學習主題吧！
            </p>
            <Button
              onClick={() => openForm()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增主題
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              index={index}
              onEdit={() => openForm(topic)}
              onDelete={() => openDeleteDialog(topic)}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯表單 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? "編輯主題" : "新增主題"}
              </DialogTitle>
              <DialogDescription>
                {editingTopic ? "修改主題名稱" : "建立新的學習主題或章節"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {formError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="topicTitle">主題名稱 *</Label>
                <Input
                  id="topicTitle"
                  placeholder="例如：第一章、多項式、文法基礎"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={formLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={formLoading}
              >
                {formLoading ? "處理中..." : editingTopic ? "儲存" : "建立"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 - 移到外層 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除「{deletingTopic?.title}」後，該主題下的所有單元都會一併刪除，此操作無法復原。
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

// 主題項目元件
function TopicItem({
  topic,
  index,
  onEdit,
  onDelete,
}: {
  topic: Topic
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="group">
      <div className="flex items-center justify-between p-4">
        <Link
          href={`/dashboard/subjects/${topic.subject_id}/topics/${topic.id}`}
          className="flex items-center gap-4 flex-1"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-medium">
            {index + 1}
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{topic.title}</h3>
            <p className="text-sm text-gray-500">點擊查看單元</p>
          </div>
        </Link>

        {/* 選單 */}
        <div className="relative">
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
    </Card>
  )
}
