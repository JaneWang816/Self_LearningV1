// app/(dashboard)/dashboard/mistakes/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  BookX,
  Play,
  CheckCircle,
  HelpCircle,
  ListChecks,
  PenLine,
  MessageSquare,
  TrendingUp,
  Award,
  Target,
} from "lucide-react"
import type { Subject, Question, QuestionType } from "@/types/database.types"

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

export default function MistakesPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // 篩選條件
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("wrong_count")

  // 統計資料
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    inProgress: 0,
  })

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

    // 取得統計
    await fetchStats(user.id)

    // 取得錯題
    await fetchQuestions(user.id)

    setLoading(false)
  }

  const fetchStats = async (userId: string) => {
    // 總共做過的題目
    const { count: totalCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("attempt_count", 0)

    // 已熟練（連續答對 >= 3）
    const { count: masteredCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("consecutive_correct", 3)

    // 練習中
    const { count: inProgressCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("attempt_count", 0)
      .lt("consecutive_correct", 3)

    setStats({
      total: totalCount || 0,
      mastered: masteredCount || 0,
      inProgress: inProgressCount || 0,
    })
  }

  const fetchQuestions = async (userId?: string) => {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id
    }

    // 錯題條件：做過的 AND 連續答對 < 3
    let query = supabase
      .from("questions")
      .select("*")
      .eq("user_id", userId)
      .gt("attempt_count", 0)
      .lt("consecutive_correct", 3)
      .is("parent_id", null)

    if (filterSubject !== "all") {
      query = query.eq("subject_id", filterSubject)
    }

    if (filterType !== "all") {
      query = query.eq("question_type_id", filterType)
    }

    // 排序
    if (sortBy === "wrong_count") {
      query = query.order("wrong_count", { ascending: false })
    } else if (sortBy === "recent") {
      query = query.order("last_attempted_at", { ascending: false })
    } else if (sortBy === "oldest") {
      query = query.order("last_attempted_at", { ascending: true })
    }

    const { data } = await query

    if (data) setQuestions(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [filterSubject, filterType, sortBy])

  // 開始練習（隨機或順序）
  const startPractice = (random: boolean = false) => {
    if (questions.length === 0) return

    let targetQuestion: Question
    if (random) {
      const randomIndex = Math.floor(Math.random() * questions.length)
      targetQuestion = questions[randomIndex]
    } else {
      targetQuestion = questions[0]
    }

    router.push(`/dashboard/practice/${targetQuestion.id}`)
  }

  // 取得題型資訊
  const getQuestionType = (typeId: string) => {
    return questionTypes.find((t) => t.id === typeId)
  }

  // 取得科目資訊
  const getSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)
  }

  // 計算正確率（加入 null 檢查）
  const getAccuracy = (question: Question) => {
    const attemptCount = question.attempt_count ?? 0
    const wrongCount = question.wrong_count ?? 0
    if (attemptCount === 0) return 0
    const correctCount = attemptCount - wrongCount
    return Math.round((correctCount / attemptCount) * 100)
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
          <h1 className="text-2xl font-bold text-gray-800">錯題本</h1>
          <p className="text-gray-600 mt-1">複習做過但還沒熟練的題目</p>
        </div>
        {questions.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => startPractice(true)}>
              🎲 隨機練習
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => startPractice(false)}
            >
              <Play className="w-4 h-4 mr-2" />
              開始練習
            </Button>
          </div>
        )}
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已練習題目</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">練習中</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已熟練</p>
              <p className="text-2xl font-bold">{stats.mastered}</p>
            </div>
          </CardContent>
        </Card>
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
        <div className="w-48">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wrong_count">錯誤次數最多</SelectItem>
              <SelectItem value="recent">最近作答</SelectItem>
              <SelectItem value="oldest">最久未練習</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 題目列表 */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              太棒了！沒有待複習的題目
            </h3>
            <p className="text-gray-600 text-center">
              {stats.total === 0
                ? "還沒有開始練習，去題庫開始吧！"
                : "所有題目都已經熟練了，繼續保持！"}
            </p>
            {stats.total === 0 && (
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/dashboard/practice")}
              >
                前往題庫
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <MistakeCard
              key={question.id}
              question={question}
              questionType={getQuestionType(question.question_type_id)}
              subject={getSubject(question.subject_id)}
              accuracy={getAccuracy(question)}
              onPractice={() => router.push(`/dashboard/practice/${question.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 錯題卡片元件
function MistakeCard({
  question,
  questionType,
  subject,
  accuracy,
  onPractice,
}: {
  question: Question
  questionType?: QuestionType
  subject?: Subject
  accuracy: number
  onPractice: () => void
}) {
  const Icon = questionType
    ? typeIcons[questionType.name] || HelpCircle
    : HelpCircle
  const colorClass = questionType
    ? typeColors[questionType.name] || "text-gray-600 bg-gray-100"
    : "text-gray-600 bg-gray-100"
  const consecutiveCorrect = (question as any).consecutive_correct || 0

  // 使用 nullish coalescing 處理可能為 null 的值
  const attemptCount = question.attempt_count ?? 0
  const wrongCount = question.wrong_count ?? 0

  // 進度條顏色
  const getProgressColor = () => {
    if (consecutiveCorrect >= 2) return "bg-green-500"
    if (consecutiveCorrect >= 1) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 題型圖示 */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
          >
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
              {question.marked_for_review && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 rounded text-amber-600">
                  ⭐ 已標記
                </span>
              )}
            </div>
            <p className="text-gray-800 line-clamp-2 mb-2">{question.content}</p>

            {/* 統計資訊 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                作答 {attemptCount} 次
              </span>
              <span>
                答錯 {wrongCount} 次
              </span>
              <span>
                正確率 {accuracy}%
              </span>
            </div>

            {/* 熟練度進度條 */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>熟練度</span>
                <span>{consecutiveCorrect} / 3</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor()}`}
                  style={{ width: `${(consecutiveCorrect / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 練習按鈕 */}
          <Button
            size="sm"
            className="shrink-0 bg-green-600 hover:bg-green-700"
            onClick={onPractice}
          >
            <Play className="w-4 h-4 mr-1" />
            練習
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
