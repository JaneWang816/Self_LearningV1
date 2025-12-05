// app/(dashboard)/dashboard/mistakes/page.tsx
import { Card, CardContent } from "@/components/ui/card"
import { XCircle } from "lucide-react"

export default function MistakesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">錯題本</h1>
        <p className="text-gray-600 mt-1">複習答錯的題目</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            太棒了！沒有錯題
          </h3>
          <p className="text-gray-600 text-center mb-4">
            答錯的題目會自動收集到這裡
          </p>
          <p className="text-sm text-gray-400">
            （功能開發中）
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
