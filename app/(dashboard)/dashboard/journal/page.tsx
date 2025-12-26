// app/(dashboard)/dashboard/journal/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  FileText,
  BookMarked,
  Heart,
  ChevronRight,
  Calendar,
  PenLine,
} from "lucide-react"
import { MOOD_LABELS } from "@/types/custom"
import type {
  JournalLife,
  JournalLearning,
  JournalReading,
  JournalGratitude,
} from "@/types/custom"

// 日誌類型配置
const journalTypes = [
  {
    key: "life",
    title: "生活日誌",
    description: "記錄日常生活點滴",
    href: "/dashboard/journal/life",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    key: "learning",
    title: "學習日誌",
    description: "追蹤學習進度與心得",
    href: "/dashboard/journal/learning",
    icon: BookMarked,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    key: "reading",
    title: "閱讀日誌",
    description: "記錄閱讀書籍與感想",
    href: "/dashboard/journal/reading",
    icon: BookOpen,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    key: "gratitude",
    title: "感恩日誌",
    description: "感謝生活中的美好",
    href: "/dashboard/journal/gratitude",
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
]

export default function JournalPage() {
  const [stats, setStats] = useState({
    life: { count: 0, latest: null as JournalLife | null },
    learning: { count: 0, latest: null as JournalLearning | null },
    reading: { count: 0, latest: null as JournalReading | null },
    gratitude: { count: 0, latest: null as JournalGratitude | null },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 取得各類日誌統計
      const [lifeRes, learningRes, readingRes, gratitudeRes] = await Promise.all([
        supabase
          .from("journals_life")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1),
        supabase
          .from("journals_learning")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1),
        supabase
          .from("journals_reading")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1),
        supabase
          .from("journals_gratitude")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1),
      ])

      // 取得總數
      const [lifeCount, learningCount, readingCount, gratitudeCount] = await Promise.all([
        supabase
          .from("journals_life")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("journals_learning")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("journals_reading")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("journals_gratitude")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])

      setStats({
        life: {
          count: lifeCount.count || 0,
          latest: lifeRes.data?.[0] || null,
        },
        learning: {
          count: learningCount.count || 0,
          latest: learningRes.data?.[0] || null,
        },
        reading: {
          count: readingCount.count || 0,
          latest: readingRes.data?.[0] || null,
        },
        gratitude: {
          count: gratitudeCount.count || 0,
          latest: gratitudeRes.data?.[0] || null,
        },
      })

      setLoading(false)
    }

    fetchStats()
  }, [])

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
    })
  }

  // 取得最新日誌預覽
  const getPreview = (type: string) => {
    const stat = stats[type as keyof typeof stats]
    if (!stat.latest) return "尚無紀錄"

    switch (type) {
      case "life": {
        const life = stat.latest as JournalLife
        const mood = life.mood ? MOOD_LABELS[life.mood] : ""
        return `${formatDate(life.date)} ${mood}`
      }
      case "learning": {
        const learning = stat.latest as JournalLearning
        return `${formatDate(learning.date)} - ${learning.title || "學習紀錄"}`
      }
      case "reading": {
        const reading = stat.latest as JournalReading
        return `${formatDate(reading.date)} - ${reading.book_title}`
      }
      case "gratitude": {
        const gratitude = stat.latest as JournalGratitude
        const preview = gratitude.content.slice(0, 30)
        return `${formatDate(gratitude.date)} - ${preview}${gratitude.content.length > 30 ? "..." : ""}`
      }
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalCount = stats.life.count + stats.learning.count + stats.reading.count + stats.gratitude.count

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">日誌</h1>
          <p className="text-gray-600 mt-1">記錄生活、學習與成長</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            日曆視圖
          </Button>
        </Link>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
            <p className="text-sm text-gray-500">總日誌數</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.life.count}</p>
            <p className="text-sm text-gray-500">生活日誌</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.learning.count}</p>
            <p className="text-sm text-gray-500">學習日誌</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.reading.count}</p>
            <p className="text-sm text-gray-500">閱讀日誌</p>
          </CardContent>
        </Card>
      </div>

      {/* 日誌類型卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {journalTypes.map((type) => {
          const Icon = type.icon
          const stat = stats[type.key as keyof typeof stats]

          return (
            <Link key={type.key} href={type.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${type.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {type.title}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">
                          {stat.count} 篇紀錄
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {getPreview(type.key)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 快速新增 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenLine className="w-5 h-5" />
            快速新增
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {journalTypes.map((type) => {
              const Icon = type.icon
              return (
                <Link key={type.key} href={`${type.href}?new=true`}>
                  <Button variant="outline" className="gap-2">
                    <Icon className={`w-4 h-4 ${type.color}`} />
                    {type.title}
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
