// app/(dashboard)/dashboard/flashcards/page.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

export default function FlashcardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">記憶卡片</h1>
        <p className="text-gray-600 mt-1">間隔重複，高效記憶</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            尚未建立卡片
          </h3>
          <p className="text-gray-600 text-center mb-4">
            建立記憶卡片，開始高效學習！
          </p>
          <p className="text-sm text-gray-400">
            （功能開發中）
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
