// app/(dashboard)/dashboard/practice/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { QuestionForm } from "@/components/questions/question-form"
import { QuestionImport } from "@/components/questions/question-import"
import {
  FileQuestion,
  Plus,
  Upload,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  ListChecks,
  PenLine,
  MessageSquare,
  Image,
} from "lucide-react"
import type { Subject, Question, QuestionType } from "@/types/supabase"

// 題型圖示對應
const typeIcons: Record<string, React.ElementType> = {
  true_false: CheckCircle,
  single_choice: HelpCircle,
  multiple_choice: ListChecks,
  fill_in_blank: PenLine,
  essay: MessageSquare,
}

// 題型顏色對應
const typeColors: Record<string, string> = {
  true_false: "text-green-600 bg-green-100",
  single_choice: "text-blue-600 bg-blue-100",
  multiple_choice: "text-purple-600 bg-purple-100",
  fill_in_blank: "text-amber-600 bg-amber-100",
  essay: "text-pink-600 bg-pink-100",
}

export default function PracticePage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選條件
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editingTopicIds, setEditingTopicIds] = useState<string[]>([])

  // 匯入對話框
  const [importOpen, setImportOpen] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得科目
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("title")

    if (subjectsData) setSubjects(subjectsData)

    // 取得題型
    const { data: typesData } = await supabase
      .from("question_types")
      .select("*")

    if (typesData) setQuestionTypes(typesData)

    // 取得題目
    await fetchQuestions(user.id)

    setLoading(false)
  }

  const fetchQuestions = async (userId?: string) => {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id
    }

    let query = supabase
      .from("questions")
      .select("*")
      .eq("user_id", userId)
      .is("parent_id", null) // 排除子題
      .order("created_at", { ascending: false })

    if (filterSubject !== "all") {
      query = query.eq("subject_id", filterSubject)
    }

    if (filterType !== "all") {
      query = query.eq("question_type_id", filterType)
    }

    const { data } = await query

    if (data) setQuestions(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [filterSubject, filterType])

  // 開啟編輯表單
  const openEditForm = async (question: Question) => {
    // 取得關聯主題
    const { data: topicLinks } = await supabase
      .from("question_topics")
      .select("topic_id")
      .eq("question_id", question.id)

    setEditingQuestion(question)
    setEditingTopicIds(topicLinks?.map((l) => l.topic_id) || [])
    setFormOpen(true)
  }

  // 關閉表單
  const closeForm = () => {
    setFormOpen(false)
    setEditingQuestion(null)
    setEditingTopicIds([])
  }

  // 開啟刪除確認
  const openDeleteDialog = (question: Question) => {
    setDeletingQuestion(question)
    setDeleteDialogOpen(true)
  }

  // 刪除題目
  const handleDelete = async () => {
    if (!deletingQuestion) return

    setDeleteLoading(true)
    
    // 先刪除關聯主題
    await supabase
      .from("question_topics")
      .delete()
      .eq("question_id", deletingQuestion.id)

    // 再刪除題目
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", deletingQuestion.id)

    if (!error) {
      await fetchQuestions()
    }

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingQuestion(null)
  }

  // 取得題型資訊
  const getQuestionType = (typeId: string) => {
    return questionTypes.find((t) => t.id === typeId)
  }

  // 取得科目資訊
  const getSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">題庫管理</h1>
          <p className="text-gray-600 mt-1">管理練習題目</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            批次匯入
          </Button>
          <Button
            onClick={() => setFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增題目
          </Button>
        </div>
      </div>

      {/* 篩選列 */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger>
              <SelectValue placeholder="選擇科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有科目</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="選擇題型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有題型</SelectItem>
              {questionTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 題目列表 */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FileQuestion className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              尚未建立題目
            </h3>
            <p className="text-gray-600 text-center mb-4">
              開始建立練習題目吧！
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                批次匯入
              </Button>
              <Button
                onClick={() => setFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增題目
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              questionType={getQuestionType(question.question_type_id)}
              subject={getSubject(question.subject_id)}
              onEdit={() => openEditForm(question)}
              onDelete={() => openDeleteDialog(question)}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯表單 */}
      <QuestionForm
        open={formOpen}
        onOpenChange={closeForm}
        onSuccess={() => {
          fetchQuestions()
          closeForm()
        }}
        question={editingQuestion}
        questionTopicIds={editingTopicIds}
      />

      {/* 批次匯入 */}
      <QuestionImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => fetchQuestions()}
        subjects={subjects}
        questionTypes={questionTypes}
      />

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除此題目後無法復原。
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

// 題目卡片元件
function QuestionCard({
  question,
  questionType,
  subject,
  onEdit,
  onDelete,
}: {
  question: Question
  questionType?: QuestionType
  subject?: Subject
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const Icon = questionType ? typeIcons[questionType.name] || HelpCircle : HelpCircle
  const colorClass = questionType ? typeColors[questionType.name] || "text-gray-600 bg-gray-100" : "text-gray-600 bg-gray-100"
  const hasImage = !!(question as any).image_url

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 題型圖示 */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* 題目內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                {subject?.title || "未分類"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                {questionType?.label || "未知題型"}
              </span>
              {hasImage && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-600 flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  含圖片
                </span>
              )}
              {question.marked_for_review && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 rounded text-amber-600">
                  待複習
                </span>
              )}
            </div>
            <p className="text-gray-800 line-clamp-2">{question.content}</p>
            {question.attempt_count > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                作答 {question.attempt_count} 次，答錯 {question.wrong_count} 次
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
