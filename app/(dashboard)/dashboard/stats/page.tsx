// app/(dashboard)/dashboard/stats/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Flame,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Brain,
  BarChart3,
  Clock,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import { getStudySummary, getStudyStreak } from "@/lib/study-stats"

// 類型定義（允許 null）
interface DailyStudySummary {
  id: string
  user_id: string
  date: string
  flashcard_reviewed: number | null
  flashcard_correct: number | null
  question_practiced: number | null
  question_correct: number | null
  study_minutes: number | null
}

interface SubjectStats {
  name: string
  totalQuestions: number
  correctRate: number
  masteredCount: number
}

interface FlashcardStats {
  newCards: number
  learning: number
  mastered: number
  easeDistribution: { range: string; count: number }[]
}

// 顏色常數
const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
}

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#22c55e"]

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)
  
  // 統計數據
  const [streak, setStreak] = useState(0)
  const [dailySummary, setDailySummary] = useState<DailyStudySummary[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({
    newCards: 0,
    learning: 0,
    mastered: 0,
    easeDistribution: [],
  })
  const [upcomingReviews, setUpcomingReviews] = useState<{ date: string; count: number }[]>([])

  // 載入所有數據
  const loadStats = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // 載入連續天數
    const streakDays = await getStudyStreak()
    setStreak(streakDays)

    // 載入每日統計
    const summary = await getStudySummary(timeRange)
    if (summary) {
      setDailySummary(summary as DailyStudySummary[])
    }

    // 載入科目統計
    await loadSubjectStats(user.id)

    // 載入 Flashcard 統計
    await loadFlashcardStats(user.id)

    // 載入未來複習預報
    await loadUpcomingReviews(user.id)

    setLoading(false)
  }

  // 載入科目統計
  const loadSubjectStats = async (userId: string) => {
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, title")
      .eq("user_id", userId)

    if (!subjects) return

    const stats: SubjectStats[] = []

    for (const subject of subjects) {
      const { data: questions } = await supabase
        .from("questions")
        .select("attempt_count, wrong_count, consecutive_correct")
        .eq("subject_id", subject.id)
        .eq("user_id", userId)

      if (questions && questions.length > 0) {
        const totalAttempts = questions.reduce((sum, q) => sum + (q.attempt_count || 0), 0)
        const totalWrong = questions.reduce((sum, q) => sum + (q.wrong_count || 0), 0)
        const masteredCount = questions.filter(q => (q.consecutive_correct || 0) >= 3).length
        
        const correctRate = totalAttempts > 0 
          ? Math.round(((totalAttempts - totalWrong) / totalAttempts) * 100)
          : 0

        stats.push({
          name: subject.title,
          totalQuestions: questions.length,
          correctRate,
          masteredCount,
        })
      }
    }

    setSubjectStats(stats)
  }

  // 載入 Flashcard 統計
  const loadFlashcardStats = async (userId: string) => {
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("ease_factor, repetition_count, interval")
      .eq("user_id", userId)

    if (!flashcards) return

    // 分類：新卡、學習中、已熟練
    let newCards = 0
    let learning = 0
    let mastered = 0

    // ease factor 分佈
    const easeRanges: Record<string, number> = {
      "1.3-1.7": 0,
      "1.8-2.2": 0,
      "2.3-2.5": 0,
      "2.6-3.0": 0,
    }

    flashcards.forEach(card => {
      const ef = card.ease_factor || 2.5
      const rep = card.repetition_count || 0
      const interval = card.interval || 0

      // 分類
      if (rep === 0) {
        newCards++
      } else if (interval < 21) {
        learning++
      } else {
        mastered++
      }

      // ease factor 分佈
      if (ef < 1.8) easeRanges["1.3-1.7"]++
      else if (ef < 2.3) easeRanges["1.8-2.2"]++
      else if (ef <= 2.5) easeRanges["2.3-2.5"]++
      else easeRanges["2.6-3.0"]++
    })

    setFlashcardStats({
      newCards,
      learning,
      mastered,
      easeDistribution: Object.entries(easeRanges).map(([range, count]) => ({
        range,
        count,
      })),
    })
  }

  // 載入未來複習預報
  const loadUpcomingReviews = async (userId: string) => {
    const today = new Date()
    const reviews: { date: string; count: number }[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const { count } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("next_review_at", dateStr)
        .lt("next_review_at", nextDay.toISOString().split("T")[0])

      reviews.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count: count || 0,
      })
    }

    setUpcomingReviews(reviews)
  }

  useEffect(() => {
    loadStats()
  }, [timeRange])

  // 計算總計數據
  const totals = dailySummary.reduce(
    (acc, day) => ({
      flashcardReviewed: acc.flashcardReviewed + (day.flashcard_reviewed || 0),
      flashcardCorrect: acc.flashcardCorrect + (day.flashcard_correct || 0),
      questionPracticed: acc.questionPracticed + (day.question_practiced || 0),
      questionCorrect: acc.questionCorrect + (day.question_correct || 0),
      studyMinutes: acc.studyMinutes + (day.study_minutes || 0),
    }),
    { flashcardReviewed: 0, flashcardCorrect: 0, questionPracticed: 0, questionCorrect: 0, studyMinutes: 0 }
  )

  const flashcardAccuracy = totals.flashcardReviewed > 0
    ? Math.round((totals.flashcardCorrect / totals.flashcardReviewed) * 100)
    : 0

  const questionAccuracy = totals.questionPracticed > 0
    ? Math.round((totals.questionCorrect / totals.questionPracticed) * 100)
    : 0

  // 圖表數據轉換
  const chartData = dailySummary.map(day => ({
    date: day.date.slice(5), // MM-DD
    複習卡片: day.flashcard_reviewed || 0,
    練習題目: day.question_practiced || 0,
    學習時間: day.study_minutes || 0,
  }))

  // 卡片成熟度圓餅圖數據
  const maturityData = [
    { name: "新卡", value: flashcardStats.newCards },
    { name: "學習中", value: flashcardStats.learning },
    { name: "已熟練", value: flashcardStats.mastered },
  ].filter(d => d.value > 0)

  // 雷達圖數據
  const radarData = subjectStats.map(s => ({
    subject: s.name.length > 4 ? s.name.slice(0, 4) + "..." : s.name,
    掌握率: s.correctRate,
    fullMark: 100,
  }))

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
          <h1 className="text-2xl font-bold text-gray-800">學習統計</h1>
          <p className="text-gray-500">追蹤你的學習進度</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={timeRange === days ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={timeRange === days ? "bg-blue-600" : ""}
            >
              {days}天
            </Button>
          ))}
        </div>
      </div>

      {/* 總覽卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{streak}</p>
                <p className="text-sm text-gray-500">連續學習天數</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totals.flashcardReviewed}</p>
                <p className="text-sm text-gray-500">複習卡片數</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{flashcardAccuracy}%</p>
                <p className="text-sm text-gray-500">卡片掌握率</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totals.studyMinutes}</p>
                <p className="text-sm text-gray-500">學習分鐘數</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 學習趨勢圖 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            每日學習趨勢
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }} 
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="複習卡片"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="練習題目"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ fill: COLORS.success, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              尚無學習記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 複習預報 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            未來 7 天複習預報
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={upcomingReviews}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="待複習卡片" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 兩欄佈局 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 卡片成熟度 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              卡片成熟度分佈
            </h3>
            {maturityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={maturityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {maturityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                尚無卡片資料
              </div>
            )}
          </CardContent>
        </Card>

        {/* 科目掌握度雷達圖 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              各科目掌握度
            </h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6b7280" fontSize={10} />
                  <Radar
                    name="掌握率"
                    dataKey="掌握率"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                尚無科目資料
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ease Factor 分佈 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            記憶難度分佈（Ease Factor）
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            數值越低表示該卡片越難記憶，需要更頻繁複習
          </p>
          {flashcardStats.easeDistribution.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={flashcardStats.easeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" name="卡片數" radius={[4, 4, 0, 0]}>
                  {flashcardStats.easeDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? COLORS.danger
                          : index === 1
                          ? COLORS.warning
                          : index === 2
                          ? COLORS.primary
                          : COLORS.success
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              尚無卡片資料
            </div>
          )}
        </CardContent>
      </Card>

      {/* 題目練習統計 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">題目練習統計</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totals.questionPracticed}</p>
              <p className="text-sm text-gray-600">練習題數</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{totals.questionCorrect}</p>
              <p className="text-sm text-gray-600">答對題數</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{questionAccuracy}%</p>
              <p className="text-sm text-gray-600">正確率</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {subjectStats.reduce((sum, s) => sum + s.masteredCount, 0)}
              </p>
              <p className="text-sm text-gray-600">已掌握題目</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各科目詳細統計 */}
      {subjectStats.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">各科目詳細統計</h3>
            <div className="space-y-4">
              {subjectStats.map((subject, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">
                    {subject.name}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${subject.correctRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-700">
                    {subject.correctRate}%
                  </div>
                  <div className="w-20 text-right text-xs text-gray-500">
                    {subject.masteredCount}/{subject.totalQuestions} 已掌握
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
