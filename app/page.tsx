//app/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Target, TrendingUp } from "lucide-react"

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
            <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="max-w-4xl w-full space-y-12">
                    {/* 主標題區 */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-800">
                            歡迎使用自主學習平台
                        </h1>
                        <p className="text-xl text-gray-600">
                            打造屬於你的個人化學習系統，輕鬆管理科目、筆記與練習題
                        </p>
                    </div>

                    {/* 特色卡片 - 縮小 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto">
                        <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-blue-100 hover:border-blue-300 transition-colors">
                            <BookOpen className="w-6 h-6 text-blue-500 mb-2 mx-auto" />
                            <h3 className="font-semibold text-sm text-gray-800">重點整理</h3>
                            <p className="text-xs text-gray-600">卡片式瀏覽</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-100 hover:border-green-300 transition-colors">
                            <Target className="w-6 h-6 text-green-500 mb-2 mx-auto" />
                            <h3 className="font-semibold text-sm text-gray-800">題庫練習</h3>
                            <p className="text-xs text-gray-600">即時批改</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-amber-100 hover:border-amber-300 transition-colors">
                            <TrendingUp className="w-6 h-6 text-amber-500 mb-2 mx-auto" />
                            <h3 className="font-semibold text-sm text-gray-800">錯題本</h3>
                            <p className="text-xs text-gray-600">智能複習</p>
                        </div>
                    </div>

                    {/* CTA 區域 - 按鈕放大 */}
                    <div className="flex flex-col items-center gap-6">
                        <Link href="/login" className="w-full max-w-md">
                            <Button
                                size="lg"
                                className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                開始學習
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
        </div>
    )
}