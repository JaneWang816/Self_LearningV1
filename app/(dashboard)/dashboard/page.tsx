// app/(dashboard)/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileQuestion, XCircle, Lightbulb } from "lucide-react"

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    wrongQuestions: 0,
    flashcards: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      // 取得用戶資訊
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserName(user.user_metadata?.full_name || "同學")

      // 取得科目數量
      const { count: subjectsCount } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // 取得題目數量
      const { count: questionsCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // 取得待複習題目數量（答錯過或標記複習的）
      const { count: wrongCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .or("wrong_count.gt.0,marked_for_review.eq.true")

      // 取得記憶卡片數量
      const { count: flashcardsCount } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      setStats({
        subjects: subjectsCount || 0,
        questions: questionsCount || 0,
        wrongQuestions: wrongCount || 0,
        flashcards: flashcardsCount || 0,
      })

      setLoading(false)
    }

    fetchData()
  }, [])

  const statCards = [
    {
      title: "科目數",
      value: stats.subjects,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "題目數",
      value: stats.questions,
      icon: FileQuestion,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "待複習",
      value: stats.wrongQuestions,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "記憶卡片",
      value: stats.flashcards,
      icon: Lightbulb,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* 歡迎區 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          嗨，{userName}！
        </h1>
        <p className="text-gray-600 mt-1">
          今天想要學習什麼呢？
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速開始 */}
      <Card>
        <CardHeader>
          <CardTitle>快速開始</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStartCard
              href="/dashboard/subjects"
              icon={BookOpen}
              title="新增科目"
              description="建立你的學科分類"
              color="blue"
            />
            <QuickStartCard
              href="/dashboard/practice"
              icon={FileQuestion}
              title="開始練習"
              description="練習題目測驗"
              color="green"
            />
            <QuickStartCard
              href="/dashboard/mistakes"
              icon={XCircle}
              title="複習錯題"
              description="回顧答錯的題目"
              color="red"
            />
            <QuickStartCard
              href="/dashboard/flashcards"
              icon={Lightbulb}
              title="記憶卡片"
              description="間隔重複學習"
              color="amber"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickStartCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  color: "blue" | "green" | "red" | "amber"
}) {
  const colorClasses = {
    blue: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    green: "border-green-200 hover:border-green-400 hover:bg-green-50",
    red: "border-red-200 hover:border-red-400 hover:bg-red-50",
    amber: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
  }

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
  }

  return (
    <a
      href={href}
      className={`block p-4 border-2 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      <Icon className={`w-6 h-6 ${iconColorClasses[color]} mb-2`} />
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  )
}
