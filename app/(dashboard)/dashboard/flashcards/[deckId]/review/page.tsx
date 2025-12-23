// app/(dashboard)/dashboard/flashcards/[deckId]/review/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Layers,
  Volume2,
  VolumeX,
} from "lucide-react"
import { calculateSM2, getNextReviewText } from "@/lib/sm2"
import { speakWithLang, stopSpeaking, type LanguageCode } from "@/lib/speech"
import type { Deck, Flashcard } from "@/types/supabase"

interface DeckWithLang extends Deck {
  front_lang?: string
  back_lang?: string
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<DeckWithLang | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // 複習狀態
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)

  // 統計
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    correct: 0, // 評分 >= 3
  })

  // 語音設定
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得卡片組
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

    // 取得待複習的卡片
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const { data: cardsData } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .lte("next_review_at", today.toISOString())

    if (cardsData && cardsData.length > 0) {
      // 隨機排序
      const shuffled = shuffleArray(cardsData)
      setCards(shuffled)
      setStats({ total: shuffled.length, reviewed: 0, correct: 0 })
    } else {
      // 沒有待複習的卡片，取得所有卡片讓用戶可以練習
      const { data: allCards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", deckId)

      if (allCards && allCards.length > 0) {
        // 隨機排序
        const shuffled = shuffleArray(allCards)
        setCards(shuffled)
        setStats({ total: shuffled.length, reviewed: 0, correct: 0 })
      }
    }

    setLoading(false)
  }

  // Fisher-Yates 洗牌演算法
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  useEffect(() => {
    fetchData()
  }, [deckId])

  // 翻轉卡片
  const flipCard = () => {
    setFlipped(!flipped)
    // 自動朗讀背面
    if (!flipped && autoSpeak) {
      const currentCard = cards[currentIndex]
      if (currentCard) {
        setTimeout(() => handleSpeak(currentCard.back, "back"), 300)
      }
    }
  }

  // 朗讀文字
  const handleSpeak = async (text: string, side: "front" | "back") => {
    try {
      setIsSpeaking(true)
      const lang = side === "front" 
        ? (deck?.front_lang as LanguageCode) || "auto"
        : (deck?.back_lang as LanguageCode) || "auto"
      await speakWithLang(text, lang)
    } catch (error) {
      console.error("語音播放失敗:", error)
    } finally {
      setIsSpeaking(false)
    }
  }

  // 自動朗讀正面
  useEffect(() => {
    if (autoSpeak && cards.length > 0 && !flipped) {
      const currentCard = cards[currentIndex]
      if (currentCard) {
        handleSpeak(currentCard.front, "front")
      }
    }
    // 清理：離開時停止朗讀
    return () => {
      stopSpeaking()
    }
  }, [currentIndex, autoSpeak])

  // 離開頁面時停止朗讀
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // 評分並進入下一張
  const handleRate = async (quality: number) => {
    const currentCard = cards[currentIndex]
    if (!currentCard) return

    // 計算 SM-2
    const result = calculateSM2({
      quality,
      currentInterval: currentCard.interval || 0,
      currentEaseFactor: currentCard.ease_factor || 2.5,
      currentRepetitionCount: currentCard.repetition_count || 0,
    })

    // 更新資料庫
    await supabase
      .from("flashcards")
      .update({
        interval: result.interval,
        ease_factor: result.easeFactor,
        repetition_count: result.repetitionCount,
        next_review_at: result.nextReviewAt.toISOString(),
      })
      .eq("id", currentCard.id)

    // 更新統計
    setStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (quality >= 3 ? 1 : 0),
    }))

    // 進入下一張或完成
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    } else {
      setCompleted(true)
    }
  }

  // 重新開始
  const restart = () => {
    setCurrentIndex(0)
    setFlipped(false)
    setCompleted(false)
    setStats({ total: cards.length, reviewed: 0, correct: 0 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!deck) return null

  // 沒有卡片
  if (cards.length === 0) {
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              這個卡片組沒有卡片
            </h3>
            <p className="text-gray-600 text-center mb-4">
              先去新增一些卡片吧！
            </p>
            <Link href={`/dashboard/flashcards/${deckId}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                管理卡片
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 複習完成
  if (completed) {
    const accuracy = Math.round((stats.correct / stats.total) * 100)

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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              複習完成！
            </h2>
            <p className="text-gray-600 mb-6">
              {deck.title}
            </p>

            {/* 統計 */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-500">總計</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
                <p className="text-sm text-gray-500">順答以上</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{accuracy}%</p>
                <p className="text-sm text-gray-500">掌握率</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={restart}>
                <RotateCcw className="w-4 h-4 mr-2" />
                再練一次
              </Button>
              <Link href="/dashboard/flashcards">
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

  const currentCard = cards[currentIndex]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/flashcards/${deckId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            結束複習
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/flashcards/${deckId}`}>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">
              管理卡片
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Layers className="w-4 h-4" />
            <span>
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>
      </div>

      {/* 進度條 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </div>

      {/* 語音控制 */}
      <div className="flex justify-center">
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
            autoSpeak
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          自動朗讀 {autoSpeak ? "開" : "關"}
        </button>
      </div>

      {/* 卡片區域 */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={flipCard}
      >
        <div
          className={`relative transition-transform duration-500 transform-style-3d ${
            flipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 正面 */}
          <Card
            className={`min-h-[300px] ${flipped ? "invisible" : ""}`}
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8 relative">
              <p className="text-xs text-gray-400 mb-4">正面 · 點擊翻轉</p>
              <p className="text-xl text-gray-800 text-center whitespace-pre-wrap">
                {currentCard.front}
              </p>
              {/* 語音按鈕 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSpeak(currentCard.front, "front")
                }}
                className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="朗讀"
              >
                <Volume2 className={`w-5 h-5 ${isSpeaking ? "text-blue-600" : "text-gray-400"}`} />
              </button>
            </CardContent>
          </Card>

          {/* 背面 */}
          <Card
            className={`min-h-[300px] absolute inset-0 ${!flipped ? "invisible" : ""}`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8 relative">
              <p className="text-xs text-gray-400 mb-4">背面</p>
              <p className="text-xl text-gray-800 text-center whitespace-pre-wrap">
                {currentCard.back}
              </p>
              {/* 語音按鈕 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSpeak(currentCard.back, "back")
                }}
                className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="朗讀"
              >
                <Volume2 className={`w-5 h-5 ${isSpeaking ? "text-blue-600" : "text-gray-400"}`} />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 評分按鈕 */}
      {flipped && (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-500">你記得多少？</p>
          <div className="flex justify-center gap-2">
            {[
              { value: 0, label: "全忘", bg: "#ef4444", hover: "#dc2626" },
              { value: 1, label: "模糊", bg: "#f97316", hover: "#ea580c" },
              { value: 2, label: "要想", bg: "#eab308", hover: "#ca8a04" },
              { value: 3, label: "順答", bg: "#22c55e", hover: "#16a34a" },
              { value: 4, label: "秒答", bg: "#14b8a6", hover: "#0d9488" },
            ].map((btn) => {
              // 計算預計下次複習時間
              const preview = calculateSM2({
                quality: btn.value,
                currentInterval: currentCard.interval || 0,
                currentEaseFactor: currentCard.ease_factor || 2.5,
                currentRepetitionCount: currentCard.repetition_count || 0,
              })

              return (
                <button
                  key={btn.value}
                  onClick={() => handleRate(btn.value)}
                  className="flex flex-col items-center px-4 py-3 rounded-lg text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: btn.bg }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btn.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btn.bg)}
                >
                  <span className="font-medium">{btn.label}</span>
                  <span className="text-xs opacity-80">
                    {getNextReviewText(preview.interval)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 提示 */}
      {!flipped && (
        <p className="text-center text-sm text-gray-400">
          想好答案後，點擊卡片查看背面
        </p>
      )}
    </div>
  )
}
