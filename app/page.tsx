// app/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, BookOpen, Target, TrendingUp, Heart, Wallet } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-4xl w-full space-y-12">
          {/* 主標題區 */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CalendarDays className="w-12 h-12 text-blue-600" />
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800">
                日歷
              </h1>
              <span className="text-2xl md:text-3xl font-medium text-blue-600">
                Dayli
              </span>
            </div>
            <p className="text-xl text-gray-600">
              日子值得被記錄
            </p>
          </div>

          {/* 特色卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <BookOpen className="w-6 h-6 text-blue-500 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm text-gray-800">日誌記錄</h3>
              <p className="text-xs text-gray-600">生活、學習、閱讀</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-100 hover:border-green-300 transition-colors">
              <Target className="w-6 h-6 text-green-500 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm text-gray-800">習慣養成</h3>
              <p className="text-xs text-gray-600">每日打卡追蹤</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-amber-100 hover:border-amber-300 transition-colors">
              <TrendingUp className="w-6 h-6 text-amber-500 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm text-gray-800">學習系統</h3>
              <p className="text-xs text-gray-600">題庫、錯題、卡片</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-rose-100 hover:border-rose-300 transition-colors">
              <Heart className="w-6 h-6 text-rose-500 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm text-gray-800">健康追蹤</h3>
              <p className="text-xs text-gray-600">運動、睡眠、飲水</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-violet-100 hover:border-violet-300 transition-colors">
              <Wallet className="w-6 h-6 text-violet-500 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm text-gray-800">收支管理</h3>
              <p className="text-xs text-gray-600">記帳、分類、統計</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-cyan-100 hover:border-cyan-300 transition-colors">
              <CalendarDays className="w-6 h-6 text-cyan-500 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm text-gray-800">任務課表</h3>
              <p className="text-xs text-gray-600">待辦、排程管理</p>
            </div>
          </div>

          {/* CTA 區域 */}
          <div className="flex flex-col items-center gap-6">
            <Link href="/login" className="w-full max-w-md">
              <Button
                size="lg"
                className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                開始使用
              </Button>
            </Link>

            <div className="flex gap-6 text-sm text-gray-600">
              <Link
                href="/register"
                className="hover:text-blue-600 transition-colors"
              >
                註冊帳號
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/forgot-password"
                className="hover:text-blue-600 transition-colors"
              >
                忘記密碼
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        © 2024 日歷 Dayli. All rights reserved.
      </footer>
    </div>
  )
}
