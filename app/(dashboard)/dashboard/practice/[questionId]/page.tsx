// app/(dashboard)/dashboard/practice/[questionId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
} from "lucide-react"
import type { Question, QuestionType } from "@/types/custom"

export default function PracticeQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.questionId as string

  const [question, setQuestion] = useState<Question | null>(null)
  const [questionType, setQuestionType] = useState<QuestionType | null>(null)
  const [loading, setLoading] = useState(true)

  // 作答狀態
  const [userAnswer, setUserAnswer] = useState<string | string[]>("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // 題目列表（用於上下題導航）
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 載入題目
  const fetchQuestion = async () => {
    setLoading(true)
    setSubmitted(false)
    setUserAnswer("")
    setShowExplanation(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得題目
    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .eq("user_id", user.id)
      .single()

    if (!questionData) {
      router.push("/dashboard/practice")
      return
    }
    setQuestion(questionData)

    // 取得題型
    const { data: typeData } = await supabase
      .from("question_types")
      .select("*")
      .eq("id", questionData.question_type_id)
      .single()

    if (typeData) setQuestionType(typeData)

    // 取得同科目的題目列表（用於導航）
    const { data: questionsData } = await supabase
      .from("questions")
      .select("id")
      .eq("user_id", user.id)
      .eq("subject_id", questionData.subject_id)
      .is("parent_id", null)
      .order("created_at", { ascending: false })

    if (questionsData) {
      const ids = questionsData.map((q) => q.id)
      setQuestionIds(ids)
      setCurrentIndex(ids.indexOf(questionId))
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchQuestion()
  }, [questionId])

  // 檢查答案
  const checkAnswer = () => {
    if (!question || !questionType) return

    let correct = false
    const correctAnswer = question.answer

    switch (questionType.name) {
      case "true_false":
        correct = userAnswer === correctAnswer
        break

      case "single_choice":
        correct = userAnswer === correctAnswer
        break

      case "multiple_choice":
        const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort() : []
        const correctArr = Array.isArray(correctAnswer) ? [...correctAnswer].sort() : []
        correct = JSON.stringify(userArr) === JSON.stringify(correctArr)
        break

      case "fill_in_blank":
        // 填充題：比對文字（忽略前後空白）
        const userText = (userAnswer as string).trim().toLowerCase()
        const correctText = (correctAnswer as string).trim().toLowerCase()
        // 支援多個正確答案（逗號分隔）
        const correctOptions = correctText.split(",").map((s) => s.trim())
        correct = correctOptions.includes(userText)
        break

      case "essay":
        // 問答題不自動批改，顯示參考答案
        correct = true // 標記為已作答
        break
    }

    setIsCorrect(correct)
    setSubmitted(true)
    updateQuestionStats(correct)
  }

  // 更新題目統計
  const updateQuestionStats = async (correct: boolean) => {
    if (!question) return

    const updates: any = {
      attempt_count: (question.attempt_count || 0) + 1,
      last_attempted_at: new Date().toISOString(),
    }

    if (correct) {
      updates.consecutive_correct = ((question as any).consecutive_correct || 0) + 1
    } else {
      updates.wrong_count = (question.wrong_count || 0) + 1
      updates.consecutive_correct = 0
    }

    await supabase
      .from("questions")
      .update(updates)
      .eq("id", question.id)
  }

  // 切換標記複習
  const toggleMarkedForReview = async () => {
    if (!question) return

    const newValue = !question.marked_for_review
    await supabase
      .from("questions")
      .update({ marked_for_review: newValue })
      .eq("id", question.id)

    setQuestion({ ...question, marked_for_review: newValue })
  }

  // 導航到下一題
  const goToNext = () => {
    if (currentIndex < questionIds.length - 1) {
      router.push(`/dashboard/practice/${questionIds[currentIndex + 1]}`)
    }
  }

  // 導航到上一題
  const goToPrev = () => {
    if (currentIndex > 0) {
      router.push(`/dashboard/practice/${questionIds[currentIndex - 1]}`)
    }
  }

  // 重新作答
  const retry = () => {
    setSubmitted(false)
    setUserAnswer("")
    setShowExplanation(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!question || !questionType) {
    return null
  }

  const options = question.options as Array<{ label: string; text: string; image_url?: string }> | null
  const hasImage = !!(question as any).image_url
  const consecutiveCorrect = (question as any).consecutive_correct || 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/practice">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回題庫
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            第 {currentIndex + 1} / {questionIds.length} 題
          </span>
          <span className="text-gray-300">|</span>
          <span>連續答對：{consecutiveCorrect} 次</span>
        </div>
      </div>

      {/* 題目卡片 */}
      <Card>
        <CardContent className="p-6">
          {/* 題型標籤 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              {questionType.label}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMarkedForReview}
              className={question.marked_for_review ? "text-amber-600" : "text-gray-400"}
            >
              {question.marked_for_review ? "已標記複習" : "標記複習"}
            </Button>
          </div>

          {/* 題目內容 */}
          <div className="mb-6">
            <p className="text-lg text-gray-800 whitespace-pre-wrap">{question.content}</p>
            {hasImage && (
              <img
                src={(question as any).image_url}
                alt="題目圖片"
                className="mt-4 max-h-60 rounded-lg"
              />
            )}
          </div>

          {/* 作答區 */}
          <div className="space-y-4">
            {/* 是非題 */}
            {questionType.name === "true_false" && (
              <div className="flex gap-4">
                <Button
                  variant={userAnswer === "true" ? "default" : "outline"}
                  className={`flex-1 h-16 text-lg ${
                    submitted
                      ? question.answer === "true"
                        ? "bg-green-500 hover:bg-green-500 text-white"
                        : userAnswer === "true"
                        ? "bg-red-500 hover:bg-red-500 text-white"
                        : ""
                      : ""
                  }`}
                  onClick={() => !submitted && setUserAnswer("true")}
                  disabled={submitted}
                >
                  ⭕ 是
                </Button>
                <Button
                  variant={userAnswer === "false" ? "default" : "outline"}
                  className={`flex-1 h-16 text-lg ${
                    submitted
                      ? question.answer === "false"
                        ? "bg-green-500 hover:bg-green-500 text-white"
                        : userAnswer === "false"
                        ? "bg-red-500 hover:bg-red-500 text-white"
                        : ""
                      : ""
                  }`}
                  onClick={() => !submitted && setUserAnswer("false")}
                  disabled={submitted}
                >
                  ❌ 非
                </Button>
              </div>
            )}

            {/* 單選題 */}
            {questionType.name === "single_choice" && options && (
              <div className="space-y-2">
                {options.map((opt) => {
                  const isSelected = userAnswer === opt.label
                  const isCorrectOption = question.answer === opt.label
                  let optionClass = ""

                  if (submitted) {
                    if (isCorrectOption) {
                      optionClass = "border-green-500 bg-green-50"
                    } else if (isSelected) {
                      optionClass = "border-red-500 bg-red-50"
                    }
                  } else if (isSelected) {
                    optionClass = "border-blue-500 bg-blue-50"
                  }

                  return (
                    <div
                      key={opt.label}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${optionClass} ${
                        !submitted ? "hover:border-blue-300" : ""
                      }`}
                      onClick={() => !submitted && setUserAnswer(opt.label)}
                    >
                      <span className="font-medium text-gray-600 shrink-0">
                        ({opt.label})
                      </span>
                      <div className="flex-1">
                        <span>{opt.text}</span>
                        {opt.image_url && (
                          <img
                            src={opt.image_url}
                            alt={`選項 ${opt.label}`}
                            className="mt-2 max-h-32 rounded"
                          />
                        )}
                      </div>
                      {submitted && isCorrectOption && (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      {submitted && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 複選題 */}
            {questionType.name === "multiple_choice" && options && (
              <div className="space-y-2">
                {options.map((opt) => {
                  const selected = Array.isArray(userAnswer) ? userAnswer : []
                  const isSelected = selected.includes(opt.label)
                  const correctAnswers = Array.isArray(question.answer) ? question.answer : []
                  const isCorrectOption = correctAnswers.includes(opt.label)
                  let optionClass = ""

                  if (submitted) {
                    if (isCorrectOption) {
                      optionClass = "border-green-500 bg-green-50"
                    } else if (isSelected) {
                      optionClass = "border-red-500 bg-red-50"
                    }
                  } else if (isSelected) {
                    optionClass = "border-blue-500 bg-blue-50"
                  }

                  return (
                    <div
                      key={opt.label}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${optionClass} ${
                        !submitted ? "hover:border-blue-300" : ""
                      }`}
                      onClick={() => {
                        if (submitted) return
                        const current = Array.isArray(userAnswer) ? [...userAnswer] : []
                        if (current.includes(opt.label)) {
                          setUserAnswer(current.filter((l) => l !== opt.label))
                        } else {
                          setUserAnswer([...current, opt.label])
                        }
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={submitted}
                        className="mt-0.5"
                      />
                      <span className="font-medium text-gray-600 shrink-0">
                        ({opt.label})
                      </span>
                      <div className="flex-1">
                        <span>{opt.text}</span>
                        {opt.image_url && (
                          <img
                            src={opt.image_url}
                            alt={`選項 ${opt.label}`}
                            className="mt-2 max-h-32 rounded"
                          />
                        )}
                      </div>
                      {submitted && isCorrectOption && (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      {submitted && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                    </div>
                  )
                })}
                <p className="text-sm text-gray-500">（可選擇多個答案）</p>
              </div>
            )}

            {/* 填充題 */}
            {questionType.name === "fill_in_blank" && (
              <div>
                <Textarea
                  placeholder="輸入你的答案..."
                  value={userAnswer as string}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={submitted}
                  rows={2}
                  className={
                    submitted
                      ? isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : ""
                  }
                />
                {submitted && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">正確答案：</span>
                    <span className="text-green-600">{question.answer as string}</span>
                  </p>
                )}
              </div>
            )}

            {/* 問答題 */}
            {questionType.name === "essay" && (
              <div>
                <Textarea
                  placeholder="輸入你的答案..."
                  value={userAnswer as string}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={submitted}
                  rows={5}
                />
                {submitted && question.answer && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-700 mb-2">參考答案：</p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {question.answer as string}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 作答結果 */}
          {submitted && questionType.name !== "essay" && (
            <div
              className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                isCorrect ? "bg-green-50" : "bg-red-50"
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-green-700 font-medium">答對了！</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 font-medium">答錯了，再加油！</span>
                </>
              )}
            </div>
          )}

          {/* 解析 */}
          {submitted && question.explanation && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-blue-600"
              >
                <Eye className="w-4 h-4 mr-1" />
                {showExplanation ? "隱藏解析" : "查看解析"}
              </Button>
              {showExplanation && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{question.explanation}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部按鈕 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一題
        </Button>

        <div className="flex gap-2">
          {submitted ? (
            <>
              <Button variant="outline" onClick={retry}>
                <RotateCcw className="w-4 h-4 mr-2" />
                重新作答
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={goToNext}
                disabled={currentIndex === questionIds.length - 1}
              >
                下一題
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={checkAnswer}
              disabled={
                !userAnswer ||
                (Array.isArray(userAnswer) && userAnswer.length === 0)
              }
            >
              確認答案
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentIndex === questionIds.length - 1}
        >
          下一題
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
