// components/questions/question-import.tsx
"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileText, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { Subject, QuestionType } from "@/types/custom"

interface QuestionImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  subjects: Subject[]
  questionTypes: QuestionType[]
}

interface ParsedQuestion {
  type: string
  content: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  answer: string
  explanation: string
  valid: boolean
  error?: string
}

// 題型對應表
const typeMap: Record<string, string> = {
  "是非題": "true_false",
  "單選題": "single_choice",
  "複選題": "multiple_choice",
  "填充題": "fill_in_blank",
  "問答題": "essay",
}

export function QuestionImport({
  open,
  onOpenChange,
  onSuccess,
  subjects,
  questionTypes,
}: QuestionImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subjectId, setSubjectId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  // 重置狀態
  const resetState = () => {
    setSubjectId("")
    setFile(null)
    setParsedQuestions([])
    setError(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 關閉對話框
  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  // 下載範本
  const downloadTemplate = () => {
    const template = `題型,題目內容,選項A,選項B,選項C,選項D,正確答案,解析
是非題,地球是太陽系中最大的行星,,,,,X,木星才是最大的行星
單選題,台灣最高的山是？,玉山,阿里山,雪山,合歡山,A,玉山海拔3952公尺
複選題,下列哪些是哺乳類動物？,鯨魚,鯊魚,海豚,海龜,AC,鯨魚和海豚是哺乳類
填充題,水的化學式是____,,,,,H2O,
問答題,請說明光合作用的過程,,,,,植物利用陽光將二氧化碳和水轉換成葡萄糖和氧氣,`

    const blob = new Blob(["\uFEFF" + template], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "題目匯入範本.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // 解析 CSV
  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    // 跳過標題行
    const dataLines = lines.slice(1)

    return dataLines.map((line) => {
      // 處理 CSV 欄位（考慮逗號在引號內的情況）
      const fields = parseCSVLine(line)

      const [type, content, optionA, optionB, optionC, optionD, answer, explanation] = fields

      const question: ParsedQuestion = {
        type: type?.trim() || "",
        content: content?.trim() || "",
        optionA: optionA?.trim() || "",
        optionB: optionB?.trim() || "",
        optionC: optionC?.trim() || "",
        optionD: optionD?.trim() || "",
        answer: answer?.trim() || "",
        explanation: explanation?.trim() || "",
        valid: true,
      }

      // 驗證
      if (!question.type) {
        question.valid = false
        question.error = "缺少題型"
      } else if (!typeMap[question.type]) {
        question.valid = false
        question.error = `不支援的題型：${question.type}`
      } else if (!question.content) {
        question.valid = false
        question.error = "缺少題目內容"
      } else if (question.type === "是非題" && !["O", "X"].includes(question.answer.toUpperCase())) {
        question.valid = false
        question.error = "是非題答案必須是 O 或 X"
      } else if (question.type === "單選題" && !["A", "B", "C", "D"].includes(question.answer.toUpperCase())) {
        question.valid = false
        question.error = "單選題答案必須是 A、B、C 或 D"
      } else if (question.type === "複選題" && !/^[A-D]+$/.test(question.answer.toUpperCase())) {
        question.valid = false
        question.error = "複選題答案必須是 A、B、C、D 的組合"
      }

      return question
    })
  }

  // 解析單行 CSV（處理引號內的逗號）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)

    return result.map((s) => s.replace(/^"|"$/g, ""))
  }

  // 處理檔案選擇
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      setError("請選擇 CSV 檔案")
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)

    try {
      const text = await selectedFile.text()
      const questions = parseCSV(text)
      setParsedQuestions(questions)

      if (questions.length === 0) {
        setError("檔案中沒有找到題目資料")
      }
    } catch (err) {
      setError("檔案讀取失敗")
    }
  }

  // 執行匯入
  const handleImport = async () => {
    if (!subjectId) {
      setError("請選擇科目")
      return
    }

    const validQuestions = parsedQuestions.filter((q) => q.valid)
    if (validQuestions.length === 0) {
      setError("沒有可匯入的有效題目")
      return
    }

    setImporting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("未登入")

      let successCount = 0
      let failedCount = 0

      for (const q of validQuestions) {
        try {
          const typeName = typeMap[q.type]
          const questionType = questionTypes.find((t) => t.name === typeName)
          if (!questionType) {
            failedCount++
            continue
          }

          // 準備選項
          let options = null
          if (typeName === "single_choice" || typeName === "multiple_choice") {
            options = []
            if (q.optionA) options.push({ label: "A", text: q.optionA, image_url: null })
            if (q.optionB) options.push({ label: "B", text: q.optionB, image_url: null })
            if (q.optionC) options.push({ label: "C", text: q.optionC, image_url: null })
            if (q.optionD) options.push({ label: "D", text: q.optionD, image_url: null })
          }

          // 準備答案
          let answer: string | string[] = q.answer
          if (typeName === "true_false") {
            answer = q.answer.toUpperCase() === "O" ? "true" : "false"
          } else if (typeName === "single_choice") {
            answer = q.answer.toUpperCase()
          } else if (typeName === "multiple_choice") {
            answer = q.answer.toUpperCase().split("")
          }

          const { error: insertError } = await supabase.from("questions").insert({
            user_id: user.id,
            subject_id: subjectId,
            question_type_id: questionType.id,
            content: q.content,
            options,
            answer,
            explanation: q.explanation || null,
          })

          if (insertError) {
            failedCount++
          } else {
            successCount++
          }
        } catch {
          failedCount++
        }
      }

      setResult({ success: successCount, failed: failedCount })

      if (successCount > 0) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "匯入失敗")
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedQuestions.filter((q) => q.valid).length
  const invalidCount = parsedQuestions.filter((q) => !q.valid).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批次匯入題目</DialogTitle>
          <DialogDescription>
            上傳 CSV 檔案批次新增題目
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 下載範本 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <FileText className="w-5 h-5" />
              <span className="text-sm">下載 CSV 範本檔案</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4 mr-1" />
              下載範本
            </Button>
          </div>

          {/* 科目選擇 */}
          <div className="space-y-2">
            <Label>匯入到科目 *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="選擇科目" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 檔案上傳 */}
          <div className="space-y-2">
            <Label>選擇 CSV 檔案 *</Label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                {file ? (
                  <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">點擊選擇 CSV 檔案</p>
                    <p className="text-xs text-gray-400 mt-1">支援 UTF-8 編碼</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* 匯入結果 */}
          {result && (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                匯入完成：成功 {result.success} 題
                {result.failed > 0 && `，失敗 ${result.failed} 題`}
              </p>
            </div>
          )}

          {/* 預覽 */}
          {parsedQuestions.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>預覽（共 {parsedQuestions.length} 題）</Label>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    有效 {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      無效 {invalidCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">狀態</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">題型</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">題目</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">答案</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedQuestions.map((q, index) => (
                      <tr key={index} className={q.valid ? "" : "bg-red-50"}>
                        <td className="px-3 py-2">
                          {q.valid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-red-600">{q.error}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{q.type}</td>
                        <td className="px-3 py-2">
                          <span className="line-clamp-1">{q.content}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{q.answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={importing}
          >
            {result ? "關閉" : "取消"}
          </Button>
          {!result && (
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleImport}
              disabled={importing || validCount === 0 || !subjectId}
            >
              {importing ? "匯入中..." : `匯入 ${validCount} 題`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
