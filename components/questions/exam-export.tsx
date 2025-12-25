// components/questions/exam-export.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import type { Question, QuestionType } from "@/types/database.types"

interface ExamExportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedQuestions: Question[]
  questionTypes: QuestionType[]
}

interface QuestionScore {
  questionId: string
  score: number
}

interface TypeScoreConfig {
  typeId: string
  typeName: string
  typeLabel: string
  defaultScore: number
  count: number
}

export function ExamExport({
  open,
  onOpenChange,
  selectedQuestions,
  questionTypes,
}: ExamExportProps) {
  const [examTitle, setExamTitle] = useState("測驗卷")
  const [includeAnswer, setIncludeAnswer] = useState(false)
  const [typeScores, setTypeScores] = useState<TypeScoreConfig[]>([])
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [generating, setGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // 初始化題型分數設定
  useEffect(() => {
    if (open && selectedQuestions.length > 0) {
      // 統計各題型的題目數量
      const typeCounts: Record<string, number> = {}
      selectedQuestions.forEach((q) => {
        typeCounts[q.question_type_id] = (typeCounts[q.question_type_id] || 0) + 1
      })

      // 建立題型分數設定
      const configs: TypeScoreConfig[] = []
      Object.entries(typeCounts).forEach(([typeId, count]) => {
        const type = questionTypes.find((t) => t.id === typeId)
        if (type) {
          // 預設分數
          let defaultScore = 2
          if (type.name === "essay") defaultScore = 10
          else if (type.name === "fill_in_blank") defaultScore = 5
          else if (type.name === "multiple_choice") defaultScore = 3

          configs.push({
            typeId,
            typeName: type.name,
            typeLabel: type.label,
            defaultScore,
            count,
          })
        }
      })

      setTypeScores(configs)

      // 初始化每題分數
      const scores = selectedQuestions.map((q) => {
        const config = configs.find((c) => c.typeId === q.question_type_id)
        return {
          questionId: q.id,
          score: config?.defaultScore || 2,
        }
      })
      setQuestionScores(scores)
    }
  }, [open, selectedQuestions, questionTypes])

  // 更新題型預設分數
  const updateTypeScore = (typeId: string, newScore: number) => {
    setTypeScores((prev) =>
      prev.map((t) => (t.typeId === typeId ? { ...t, defaultScore: newScore } : t))
    )

    // 同時更新該題型所有題目的分數
    setQuestionScores((prev) =>
      prev.map((qs) => {
        const question = selectedQuestions.find((q) => q.id === qs.questionId)
        if (question?.question_type_id === typeId) {
          return { ...qs, score: newScore }
        }
        return qs
      })
    )
  }

  // 更新單題分數
  const updateQuestionScore = (questionId: string, newScore: number) => {
    setQuestionScores((prev) =>
      prev.map((qs) => (qs.questionId === questionId ? { ...qs, score: newScore } : qs))
    )
  }

  // 計算總分
  const totalScore = questionScores.reduce((sum, qs) => sum + qs.score, 0)

  // 取得題型標籤
  const getTypeLabel = (typeId: string) => {
    return questionTypes.find((t) => t.id === typeId)?.label || "未知"
  }

  // 取得題型名稱
  const getTypeName = (typeId: string) => {
    return questionTypes.find((t) => t.id === typeId)?.name || ""
  }

  // 格式化答案顯示
  const formatAnswer = (question: Question): string => {
    const typeName = getTypeName(question.question_type_id)
    const answer = question.answer

    if (!answer) return ""

    if (typeName === "true_false") {
      return answer === "true" ? "O" : "X"
    }
    if (typeName === "single_choice") {
      return String(answer)
    }
    if (typeName === "multiple_choice") {
      return Array.isArray(answer) ? answer.join("") : String(answer)
    }
    if (typeName === "fill_in_blank" || typeName === "essay") {
      return String(answer)
    }
    return String(answer)
  }

  // 格式化選項
  const formatOptions = (question: Question) => {
    if (!question.options) return null
    const options = question.options as Array<{ label: string; text: string; image_url?: string }>
    return options
  }

  // 生成 PDF
  const generatePDF = async () => {
    setGenerating(true)

    try {
      // 動態載入 html2canvas 和 jspdf
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      if (!printRef.current) return

      // 使用 html2canvas 將內容轉為圖片
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      // 計算需要幾頁
      const pageHeight = pdfHeight / ratio
      let heightLeft = imgHeight
      let position = 0

      // 第一頁
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      heightLeft -= pageHeight

      // 如果內容超過一頁，添加更多頁
      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", imgX, position * ratio, imgWidth * ratio, imgHeight * ratio)
        heightLeft -= pageHeight
      }

      // 下載 PDF
      const fileName = includeAnswer ? `${examTitle}_教師版.pdf` : `${examTitle}_學生版.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("PDF 生成失敗:", error)
      alert("PDF 生成失敗，請稍後再試")
    } finally {
      setGenerating(false)
    }
  }

  // 按題型分組題目
  const groupedQuestions: Record<string, Question[]> = {}
  selectedQuestions.forEach((q) => {
    const typeId = q.question_type_id
    if (!groupedQuestions[typeId]) {
      groupedQuestions[typeId] = []
    }
    groupedQuestions[typeId].push(q)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>匯出試卷</DialogTitle>
          <DialogDescription>
            已選擇 {selectedQuestions.length} 題，設定配分後匯出 PDF
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 試卷標題 */}
          <div className="space-y-2">
            <Label>試卷標題</Label>
            <Input
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="輸入試卷標題"
            />
          </div>

          {/* 包含答案選項 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeAnswer"
              checked={includeAnswer}
              onChange={(e) => setIncludeAnswer(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="includeAnswer" className="text-sm cursor-pointer">
              教師版（包含答案與解析）
            </label>
          </div>

          {/* 題型配分設定 */}
          <div className="space-y-3">
            <Label>題型配分設定</Label>
            <div className="border rounded-lg divide-y">
              {typeScores.map((config) => (
                <div key={config.typeId} className="flex items-center justify-between p-3">
                  <div>
                    <span className="font-medium">{config.typeLabel}</span>
                    <span className="text-sm text-gray-500 ml-2">({config.count} 題)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">每題</span>
                    <Input
                      type="number"
                      min={0}
                      value={config.defaultScore}
                      onChange={(e) => updateTypeScore(config.typeId, Number(e.target.value))}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-gray-500">分</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 展開個別題目配分 */}
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? "收起" : "展開"}個別題目配分調整
            </button>

            {showDetails && (
              <div className="mt-3 border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">題號</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">題型</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">題目</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">分數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedQuestions.map((q, index) => {
                      const score = questionScores.find((qs) => qs.questionId === q.id)?.score || 0
                      return (
                        <tr key={q.id}>
                          <td className="px-3 py-2">{index + 1}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {getTypeLabel(q.question_type_id)}
                          </td>
                          <td className="px-3 py-2">
                            <span className="line-clamp-1">{q.content}</span>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={score}
                              onChange={(e) => updateQuestionScore(q.id, Number(e.target.value))}
                              className="w-16 text-center"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 總分顯示 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-blue-700">總分</span>
            <span className="text-xl font-bold text-blue-700">{totalScore} 分</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            取消
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={generatePDF}
            disabled={generating}
          >
            {generating ? "生成中..." : "匯出 PDF"}
          </Button>
        </DialogFooter>

        {/* 隱藏的列印內容 */}
        <div className="fixed left-[-9999px] top-0">
          <div
            ref={printRef}
            className="bg-white p-8"
            style={{ width: "210mm", minHeight: "297mm", fontFamily: "sans-serif" }}
          >
            {/* 試卷標題 */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">{examTitle}</h1>
              <div className="flex justify-center gap-8 text-sm text-gray-600">
                <span>姓名：______________</span>
                <span>座號：______</span>
                <span>得分：______/{totalScore}</span>
              </div>
            </div>

            {/* 題目內容 - 按題型分組 */}
            {Object.entries(groupedQuestions).map(([typeId, questions], groupIndex) => {
              const typeLabel = getTypeLabel(typeId)
              const typeName = getTypeName(typeId)
              const config = typeScores.find((t) => t.typeId === typeId)
              const groupTotal = questions.reduce((sum, q) => {
                const score = questionScores.find((qs) => qs.questionId === q.id)?.score || 0
                return sum + score
              }, 0)

              // 計算題目起始編號
              let startIndex = 0
              Object.entries(groupedQuestions).forEach(([tId, qs]) => {
                if (tId === typeId) return
                const currentGroupIndex = Object.keys(groupedQuestions).indexOf(tId)
                if (currentGroupIndex < groupIndex) {
                  startIndex += qs.length
                }
              })

              return (
                <div key={typeId} className="mb-6">
                  {/* 題型標題 */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-300">
                    <h2 className="text-lg font-bold">
                      {["一", "二", "三", "四", "五"][groupIndex] || groupIndex + 1}、{typeLabel}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        （共 {questions.length} 題，每題 {config?.defaultScore || 0} 分，共 {groupTotal} 分）
                      </span>
                    </h2>
                  </div>

                  {/* 題目列表 */}
                  <div className="space-y-4">
                    {questions.map((question, qIndex) => {
                      const questionNumber = startIndex + qIndex + 1
                      const score = questionScores.find((qs) => qs.questionId === question.id)?.score || 0
                      const options = formatOptions(question)
                      const answer = formatAnswer(question)
                      const hasImage = !!(question as any).image_url

                      return (
                        <div key={question.id} className="mb-4">
                          {/* 題目內容 */}
                          <div className="flex gap-2">
                            <span className="font-medium shrink-0">{questionNumber}.</span>
                            <div className="flex-1">
                              <span>（{score}分）</span>
                              <span className="ml-1">{question.content}</span>
                              
                              {/* 題目圖片 */}
                              {hasImage && (
                                <div className="mt-2">
                                  <img
                                    src={(question as any).image_url}
                                    alt="題目圖片"
                                    className="max-h-40 object-contain"
                                  />
                                </div>
                              )}

                              {/* 選項 */}
                              {options && (
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                                  {options.map((opt) => (
                                    <div key={opt.label} className="flex items-start gap-1">
                                      <span>({opt.label})</span>
                                      <div>
                                        <span>{opt.text}</span>
                                        {opt.image_url && (
                                          <img
                                            src={opt.image_url}
                                            alt={`選項 ${opt.label}`}
                                            className="max-h-20 mt-1 object-contain"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 填充題作答區 */}
                              {typeName === "fill_in_blank" && !includeAnswer && (
                                <div className="mt-2 text-gray-500">
                                  答：____________________
                                </div>
                              )}

                              {/* 問答題作答區 */}
                              {typeName === "essay" && !includeAnswer && (
                                <div className="mt-2 border border-gray-300 rounded p-2 min-h-[80px]">
                                  <span className="text-gray-400 text-sm">作答區</span>
                                </div>
                              )}

                              {/* 答案（教師版） */}
                              {includeAnswer && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                  <span className="text-green-700 font-medium">答案：</span>
                                  <span className="text-green-700">{String(answer)}</span>
                                  {question.explanation && (
                                    <div className="mt-1 text-sm text-green-600">
                                      <span className="font-medium">解析：</span>
                                      {question.explanation}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
