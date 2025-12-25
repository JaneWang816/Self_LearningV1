// app/(dashboard)/dashboard/flashcards/[deckId]/test/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  Shuffle,
  Volume2,
} from "lucide-react"
import { speakWithLang, stopSpeaking, type LanguageCode } from "@/lib/speech"
import type { Deck, Flashcard } from "@/types/database.types"

type TestMode = "fill_front" | "choose_back" | "choose_front"

interface TestQuestion {
  card: Flashcard
  options?: string[] // 選擇題選項
  correctIndex?: number // 正確答案索引
}

export default function FlashcardTestPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // 測驗狀態
  const [testMode, setTestMode] = useState<TestMode | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)

  // 統計
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })

  // 離開頁面時停止語音
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // 載入資料
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: deckData } = await supabase
        .from("decks")
        .select("*")
        .eq("id", deckId)
        .eq("user_id", user.id)
        .single()

      if (!deckData) {
        router.push("/dashboard/flashcards")
        return
      }
      setDeck(deckData)

      const { data: cardsData } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", deckId)

      if (cardsData) {
        setCards(cardsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [deckId, router])

  // Fisher-Yates 洗牌
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // 開始測驗
  const startTest = (mode: TestMode) => {
    setTestMode(mode)
    setCurrentIndex(0)
    setStats({ correct: 0, wrong: 0 })
    setTestCompleted(false)

    // 打亂卡片順序
    const shuffledCards = shuffleArray(cards)

    if (mode === "fill_front") {
      // 填充題：不需要選項
      setQuestions(shuffledCards.map((card) => ({ card })))
    } else {
      // 選擇題：生成選項
      const questionsWithOptions = shuffledCards.map((card) => {
        // 取得其他卡片作為錯誤選項
        const otherCards = cards.filter((c) => c.id !== card.id)
        const wrongOptions = shuffleArray(otherCards).slice(0, 3)

        // 決定要顯示的內容
        const correctAnswer = mode === "choose_back" ? card.back : card.front
        const wrongAnswers = wrongOptions.map((c) =>
          mode === "choose_back" ? c.back : c.front
        )

        // 合併並打亂選項
        const allOptions = [correctAnswer, ...wrongAnswers]
        const shuffledOptions = shuffleArray(allOptions)
        const correctIndex = shuffledOptions.indexOf(correctAnswer)

        return {
          card,
          options: shuffledOptions,
          correctIndex,
        }
      })

      setQuestions(questionsWithOptions)
    }

    resetQuestion()
  }

  // 重置當前題目狀態
  const resetQuestion = () => {
    setUserAnswer("")
    setSelectedOption(null)
    setShowResult(false)
    setIsCorrect(false)
  }

  // 提交答案
  const submitAnswer = () => {
    const question = questions[currentIndex]
    let correct = false

    if (testMode === "fill_front") {
      // 填充題：比對答案（忽略大小寫和空白）
      const userAns = userAnswer.trim().toLowerCase()
      const correctAns = question.card.back.trim().toLowerCase()
      correct = userAns === correctAns
    } else {
      // 選擇題
      correct = selectedOption === question.correctIndex
    }

    setIsCorrect(correct)
    setShowResult(true)
    setStats((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }))
  }

  // 下一題
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      resetQuestion()
    } else {
      setTestCompleted(true)
    }
  }

  // 重新測驗
  const restartTest = () => {
    if (testMode) {
      startTest(testMode)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!deck) return null

  // 卡片不足
  if (cards.length < 4) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/dashboard/flashcards/${deckId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              卡片數量不足
            </h3>
            <p className="text-gray-600 text-center mb-4">
              測驗功能需要至少 4 張卡片，目前只有 {cards.length} 張
            </p>
            <Link href={`/dashboard/flashcards/${deckId}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                新增更多卡片
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 選擇測驗模式
  if (!testMode) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/dashboard/flashcards/${deckId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{deck.title}</h1>
          <p className="text-gray-600 mt-2">選擇測驗模式（共 {cards.length} 張卡片）</p>
        </div>

        <div className="grid gap-4">
          {/* 填充題模式 */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
            onClick={() => startTest("fill_front")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">填充題</h3>
                  <p className="text-sm text-gray-600">看正面，輸入背面答案</p>
                </div>
                <Play className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* 選擇題：看正面選背面 */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
            onClick={() => startTest("choose_back")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Shuffle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">選擇題（正→背）</h3>
                  <p className="text-sm text-gray-600">看正面，選擇正確的背面</p>
                </div>
                <Play className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* 選擇題：看背面選正面 */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-300"
            onClick={() => startTest("choose_front")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shuffle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">選擇題（背→正）</h3>
                  <p className="text-sm text-gray-600">看背面，選擇正確的正面</p>
                </div>
                <Play className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 測驗完成
  if (testCompleted) {
    const accuracy = Math.round((stats.correct / questions.length) * 100)

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              測驗完成！
            </h2>
            <p className="text-gray-600 mb-6">{deck.title}</p>

            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{questions.length}</p>
                <p className="text-sm text-gray-500">總題數</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
                <p className="text-sm text-gray-500">答對</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{accuracy}%</p>
                <p className="text-sm text-gray-500">正確率</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={restartTest}>
                <RotateCcw className="w-4 h-4 mr-2" />
                再測一次
              </Button>
              <Button
                variant="outline"
                onClick={() => setTestMode(null)}
              >
                換個模式
              </Button>
              <Link href={`/dashboard/flashcards/${deckId}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  返回卡片組
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 測驗進行中
  const question = questions[currentIndex]
  const modeLabels = {
    fill_front: "填充題",
    choose_back: "選擇題（正→背）",
    choose_front: "選擇題（背→正）",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 頂部 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setTestMode(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          結束測驗
        </Button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* 進度條 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* 模式標籤 */}
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {modeLabels[testMode]}
        </span>
      </div>

      {/* 題目 */}
      <Card>
        <CardContent className="p-8 relative">
          <p className="text-xs text-gray-400 mb-2 text-center">
            {testMode === "choose_front" ? "背面" : "正面"}
          </p>
          <p className="text-xl text-center text-gray-800 whitespace-pre-wrap">
            {testMode === "choose_front" ? question.card.back : question.card.front}
          </p>
          {/* 語音按鈕 */}
          <button
            onClick={() => {
              const isBack = testMode === "choose_front"
              const text = isBack ? question.card.back : question.card.front
              const lang = isBack 
                ? (deck?.back_lang as LanguageCode) || "auto"
                : (deck?.front_lang as LanguageCode) || "auto"
              speakWithLang(text, lang)
            }}
            className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="朗讀"
          >
            <Volume2 className="w-5 h-5 text-gray-400 hover:text-blue-600" />
          </button>
        </CardContent>
      </Card>

      {/* 答題區 */}
      {testMode === "fill_front" ? (
        // 填充題
        <div className="space-y-4">
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="輸入答案..."
            disabled={showResult}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showResult && userAnswer.trim()) {
                submitAnswer()
              }
            }}
            className="text-center text-lg"
          />

          {showResult && (
            <div
              className={`p-4 rounded-lg ${
                isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={isCorrect ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                  {isCorrect ? "正確！" : "錯誤"}
                </span>
              </div>
              {!isCorrect && (
                <p className="text-gray-700">
                  正確答案：<span className="font-medium">{question.card.back}</span>
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        // 選擇題
        <div className="space-y-3">
          {question.options?.map((option, index) => {
            let optionClass = "border-2 border-gray-200 hover:border-blue-300"

            if (showResult) {
              if (index === question.correctIndex) {
                optionClass = "border-2 border-green-500 bg-green-50"
              } else if (index === selectedOption && !isCorrect) {
                optionClass = "border-2 border-red-500 bg-red-50"
              } else {
                optionClass = "border-2 border-gray-200 opacity-50"
              }
            } else if (selectedOption === index) {
              optionClass = "border-2 border-blue-500 bg-blue-50"
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedOption(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg text-left transition-all ${optionClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-600">
                    {["A", "B", "C", "D"][index]}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap">{option}</span>
                  {showResult && index === question.correctIndex && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && index === selectedOption && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* 按鈕 */}
      <div className="flex justify-center gap-3">
        {!showResult ? (
          <Button
            onClick={submitAnswer}
            disabled={
              testMode === "fill_front"
                ? !userAnswer.trim()
                : selectedOption === null
            }
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            確認答案
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {currentIndex < questions.length - 1 ? "下一題" : "查看結果"}
          </Button>
        )}
      </div>

      {/* 統計 */}
      <div className="flex justify-center gap-6 text-sm">
        <span className="text-green-600">✓ {stats.correct}</span>
        <span className="text-red-600">✗ {stats.wrong}</span>
      </div>
    </div>
  )
}
