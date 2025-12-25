// app/(dashboard)/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ModuleType } from "@/types/custom"
import {
  BookOpen,
  CheckSquare,
  ListTodo,
  Calendar,
  GraduationCap,
  ChevronRight,
  Plus,
} from "lucide-react"

export default function OverviewPage() {
  const [enabledModules, setEnabledModules] = useState<ModuleType[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  // 取得當前日期資訊
  const today = new Date()
  const weekDay = ["日", "一", "二", "三", "四", "五", "六"][today.getDay()]
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 星期${weekDay}`

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 取得用戶資料
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, enabled_modules")
        .eq("id", user.id)
        .single()

      if (profile) {
        setUserName(profile.nickname || user.email?.split("@")[0] || "")
        setEnabledModules((profile.enabled_modules as ModuleType[]) || [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const isModuleEnabled = (module: ModuleType) => enabledModules.includes(module)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 歡迎區 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <p className="text-blue-100 text-sm">{dateStr}</p>
        <h1 className="text-2xl font-bold mt-1">
          {userName ? `${userName}，你好！` : "歡迎回來！"}
        </h1>
        <p className="text-blue-100 mt-2">今天也要加油喔 💪</p>
      </div>

      {/* 快速入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isModuleEnabled("journal") && (
          <Link href="/journal/life">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">寫日誌</span>
              </CardContent>
            </Card>
          </Link>
        )}

        {isModuleEnabled("habits") && (
          <Link href="/habits">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">習慣打卡</span>
              </CardContent>
            </Card>
          </Link>
        )}

        {isModuleEnabled("tasks") && (
          <Link href="/tasks">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <ListTodo className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">任務清單</span>
              </CardContent>
            </Card>
          </Link>
        )}

        {isModuleEnabled("study") && (
          <Link href="/dashboard/practice">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">開始練習</span>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* 今日課表（如果啟用） */}
      {isModuleEnabled("schedule") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              今日課表
            </CardTitle>
            <Link href="/schedule">
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm py-4 text-center">
              尚未設定課表，
              <Link href="/schedule" className="text-blue-600 hover:underline">
                點此設定
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* 習慣完成狀況（如果啟用） */}
      {isModuleEnabled("habits") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              今日習慣
            </CardTitle>
            <Link href="/habits">
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm py-4 text-center">
              尚未建立習慣，
              <Link href="/habits" className="text-blue-600 hover:underline">
                點此新增
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* 待處理任務（如果啟用） */}
      {isModuleEnabled("tasks") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-amber-600" />
              待處理任務
            </CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm py-4 text-center">
              沒有待處理的任務，
              <Link href="/tasks" className="text-blue-600 hover:underline">
                點此新增
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* 學習提醒（如果啟用） */}
      {isModuleEnabled("study") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              學習提醒
            </CardTitle>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-blue-600">
                進入學習 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-2">
              <Link href="/dashboard/mistakes" className="block">
                <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <p className="text-2xl font-bold text-red-600">-</p>
                  <p className="text-xs text-gray-600 mt-1">待複習錯題</p>
                </div>
              </Link>
              <Link href="/dashboard/flashcards" className="block">
                <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <p className="text-2xl font-bold text-blue-600">-</p>
                  <p className="text-xs text-gray-600 mt-1">待複習卡片</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
