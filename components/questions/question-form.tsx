// components/questions/question-form.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Plus, X, Image, Upload } from "lucide-react"
import type { Subject, Topic, QuestionType, Question } from "@/types/supabase"

interface QuestionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  question?: Question | null
  questionTopicIds?: string[]
}

interface Option {
  label: string
  text: string
  image_url?: string | null
}

export function QuestionForm({
  open,
  onOpenChange,
  onSuccess,
  question,
  questionTopicIds = [],
}: QuestionFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  
  const [subjectId, setSubjectId] = useState("")
  const [questionTypeId, setQuestionTypeId] = useState("")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [content, setContent] = useState("")
  const [options, setOptions] = useState<Option[]>([
    { label: "A", text: "", image_url: null },
    { label: "B", text: "", image_url: null },
    { label: "C", text: "", image_url: null },
    { label: "D", text: "", image_url: null },
  ])
  const [answer, setAnswer] = useState<string | string[]>("")
  const [explanation, setExplanation] = useState("")
  
  // 題目圖片
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null)
  
  // 選項圖片
  const [optionImageFiles, setOptionImageFiles] = useState<(File | null)[]>([null, null, null, null])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!question
  const selectedType = questionTypes.find((t) => t.id === questionTypeId)

  // 載入基礎資料
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 取得科目
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("title")

      if (subjectsData) setSubjects(subjectsData)

      // 取得題型
      const { data: typesData } = await supabase
        .from("question_types")
        .select("*")
        .order("name")

      if (typesData) setQuestionTypes(typesData)
    }

    if (open) fetchData()
  }, [open])

  // 當科目改變時載入主題
  useEffect(() => {
    const fetchTopics = async () => {
      if (!subjectId) {
        setTopics([])
        return
      }

      const { data: topicsData } = await supabase
        .from("topics")
        .select("*")
        .eq("subject_id", subjectId)
        .order("order")

      if (topicsData) setTopics(topicsData)
    }

    fetchTopics()
  }, [subjectId])

  // 編輯模式：填入現有資料
  useEffect(() => {
    if (question && open) {
      setSubjectId(question.subject_id)
      setQuestionTypeId(question.question_type_id)
      setContent(question.content)
      setExplanation(question.explanation || "")
      setSelectedTopics(questionTopicIds)
      
      // 題目圖片
      const imgUrl = (question as any).image_url
      setQuestionImagePreview(imgUrl || null)

      if (question.options) {
        const opts = question.options as Option[]
        setOptions(opts)
        setOptionImageFiles(opts.map(() => null))
      }

      if (question.answer) {
        setAnswer(question.answer as string | string[])
      }
    } else if (!question && open) {
      // 新增模式：重置表單
      resetForm()
    }
  }, [question, questionTopicIds, open])

  const resetForm = () => {
    setSubjectId("")
    setQuestionTypeId("")
    setSelectedTopics([])
    setContent("")
    setOptions([
      { label: "A", text: "", image_url: null },
      { label: "B", text: "", image_url: null },
      { label: "C", text: "", image_url: null },
      { label: "D", text: "", image_url: null },
    ])
    setAnswer("")
    setExplanation("")
    setQuestionImageFile(null)
    setQuestionImagePreview(null)
    setOptionImageFiles([null, null, null, null])
    setError(null)
  }

  // 處理題目圖片選擇
  const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("請選擇圖片檔案")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("圖片大小不能超過 5MB")
        return
      }
      setQuestionImageFile(file)
      setQuestionImagePreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  // 移除題目圖片
  const removeQuestionImage = () => {
    setQuestionImageFile(null)
    setQuestionImagePreview(null)
  }

  // 處理選項圖片選擇
  const handleOptionImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("請選擇圖片檔案")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("圖片大小不能超過 5MB")
        return
      }
      
      const newFiles = [...optionImageFiles]
      newFiles[index] = file
      setOptionImageFiles(newFiles)
      
      const newOptions = [...options]
      newOptions[index].image_url = URL.createObjectURL(file)
      setOptions(newOptions)
      setError(null)
    }
  }

  // 移除選項圖片
  const removeOptionImage = (index: number) => {
    const newFiles = [...optionImageFiles]
    newFiles[index] = null
    setOptionImageFiles(newFiles)
    
    const newOptions = [...options]
    newOptions[index].image_url = null
    setOptions(newOptions)
  }

  // 上傳圖片到 Supabase Storage
  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    const { error } = await supabase.storage
      .from("questions")
      .upload(fileName, file)

    if (error) {
      console.error("上傳失敗:", error)
      return null
    }

    const { data } = supabase.storage
      .from("questions")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // 新增選項
  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length)
    setOptions([...options, { label: nextLabel, text: "", image_url: null }])
    setOptionImageFiles([...optionImageFiles, null])
  }

  // 移除選項
  const removeOption = (index: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, i) => i !== index)
    const relabeled = newOptions.map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i),
    }))
    setOptions(relabeled)
    
    const newFiles = optionImageFiles.filter((_, i) => i !== index)
    setOptionImageFiles(newFiles)
    
    setAnswer("")
  }

  // 更新選項文字
  const updateOption = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  // 切換主題選擇
  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    )
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 驗證
    if (!subjectId) {
      setError("請選擇科目")
      return
    }
    if (!questionTypeId) {
      setError("請選擇題型")
      return
    }
    if (!content.trim()) {
      setError("請輸入題目內容")
      return
    }

    // 驗證選擇題選項
    if (selectedType?.name === "single_choice" || selectedType?.name === "multiple_choice") {
      const validOptions = options.filter((o) => o.text.trim() || o.image_url)
      if (validOptions.length < 2) {
        setError("至少需要 2 個選項（文字或圖片）")
        return
      }
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        setError("請選擇正確答案")
        return
      }
    }

    // 驗證是非題答案
    if (selectedType?.name === "true_false" && answer === "") {
      setError("請選擇正確答案")
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("未登入")

      // 上傳題目圖片
      let questionImageUrl = (question as any)?.image_url || null
      if (questionImageFile) {
        const uploadedUrl = await uploadImage(questionImageFile, user.id)
        if (!uploadedUrl) throw new Error("題目圖片上傳失敗")
        questionImageUrl = uploadedUrl
      } else if (!questionImagePreview) {
        questionImageUrl = null
      }

      // 處理選項
      let finalOptions = null
      if (selectedType?.name === "single_choice" || selectedType?.name === "multiple_choice") {
        const processedOptions = []
        for (let i = 0; i < options.length; i++) {
          const opt = options[i]
          if (!opt.text.trim() && !opt.image_url) continue
          
          let optImageUrl = opt.image_url
          
          // 如果有新上傳的選項圖片
          if (optionImageFiles[i]) {
            const uploadedUrl = await uploadImage(optionImageFiles[i]!, user.id)
            if (!uploadedUrl) throw new Error(`選項 ${opt.label} 圖片上傳失敗`)
            optImageUrl = uploadedUrl
          }
          // 如果是預覽 URL（blob:），清除它
          if (optImageUrl?.startsWith("blob:")) {
            optImageUrl = null
          }
          
          processedOptions.push({
            label: opt.label,
            text: opt.text,
            image_url: optImageUrl || null,
          })
        }
        finalOptions = processedOptions
      }

      // 準備答案資料
      let finalAnswer = answer
      if (selectedType?.name === "true_false") {
        finalAnswer = answer
      }

      const questionData = {
        user_id: user.id,
        subject_id: subjectId,
        question_type_id: questionTypeId,
        content: content.trim(),
        options: finalOptions,
        answer: finalAnswer,
        explanation: explanation.trim() || null,
        image_url: questionImageUrl,
      }

      if (isEdit && question) {
        // 更新題目
        const { error: updateError } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", question.id)

        if (updateError) throw updateError

        // 更新關聯主題
        await supabase
          .from("question_topics")
          .delete()
          .eq("question_id", question.id)

        if (selectedTopics.length > 0) {
          const topicLinks = selectedTopics.map((topicId) => ({
            question_id: question.id,
            topic_id: topicId,
          }))
          await supabase.from("question_topics").insert(topicLinks)
        }
      } else {
        // 新增題目
        const { data: newQuestion, error: insertError } = await supabase
          .from("questions")
          .insert(questionData)
          .select()
          .single()

        if (insertError) throw insertError

        if (selectedTopics.length > 0 && newQuestion) {
          const topicLinks = selectedTopics.map((topicId) => ({
            question_id: newQuestion.id,
            topic_id: topicId,
          }))
          await supabase.from("question_topics").insert(topicLinks)
        }
      }

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失敗")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "編輯題目" : "新增題目"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "修改題目內容" : "建立新的練習題目"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* 科目選擇 */}
            <div className="space-y-2">
              <Label>科目 *</Label>
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

            {/* 題型選擇 */}
            <div className="space-y-2">
              <Label>題型 *</Label>
              <Select value={questionTypeId} onValueChange={setQuestionTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇題型" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 關聯主題 */}
            {topics.length > 0 && (
              <div className="space-y-2">
                <Label>關聯主題（選填）</Label>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                  {topics.map((topic) => (
                    <div key={topic.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={topic.id}
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                      />
                      <label
                        htmlFor={topic.id}
                        className="text-sm cursor-pointer"
                      >
                        {topic.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 題目內容 */}
            <div className="space-y-2">
              <Label>題目內容 *</Label>
              <Textarea
                placeholder="輸入題目內容..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
            </div>

            {/* 題目圖片 */}
            <div className="space-y-2">
              <Label>題目圖片（選填）</Label>
              {questionImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={questionImagePreview}
                    alt="題目圖片預覽"
                    className="max-h-40 rounded-lg border object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeQuestionImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">上傳題目圖片</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleQuestionImageChange}
                  />
                </label>
              )}
            </div>

            {/* 是非題答案 */}
            {selectedType?.name === "true_false" && (
              <div className="space-y-2">
                <Label>正確答案 *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trueFalse"
                      value="true"
                      checked={answer === "true"}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>是 (O)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trueFalse"
                      value="false"
                      checked={answer === "false"}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>非 (X)</span>
                  </label>
                </div>
              </div>
            )}

            {/* 選擇題選項 */}
            {(selectedType?.name === "single_choice" ||
              selectedType?.name === "multiple_choice") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>選項 *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    新增選項
                  </Button>
                </div>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedType?.name === "single_choice" ? (
                          <input
                            type="radio"
                            name="answer"
                            value={option.label}
                            checked={answer === option.label}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-4 h-4"
                          />
                        ) : (
                          <Checkbox
                            checked={(answer as string[])?.includes(option.label)}
                            onCheckedChange={(checked) => {
                              const current = (answer as string[]) || []
                              if (checked) {
                                setAnswer([...current, option.label])
                              } else {
                                setAnswer(current.filter((a) => a !== option.label))
                              }
                            }}
                          />
                        )}
                        <span className="w-6 text-center font-medium">
                          {option.label}.
                        </span>
                        <Input
                          placeholder={`選項 ${option.label} 文字`}
                          value={option.text}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* 選項圖片 */}
                      <div className="ml-8">
                        {option.image_url ? (
                          <div className="relative inline-block">
                            <img
                              src={option.image_url}
                              alt={`選項 ${option.label} 圖片`}
                              className="max-h-24 rounded border object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-5 w-5"
                              onClick={() => removeOptionImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                            <Image className="w-4 h-4" />
                            <span>加入圖片</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleOptionImageChange(index, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedType?.name === "single_choice"
                    ? "點選選項前的圓圈設定正確答案"
                    : "勾選所有正確答案"}
                </p>
              </div>
            )}

            {/* 填充題答案 */}
            {selectedType?.name === "fill_in_blank" && (
              <div className="space-y-2">
                <Label>正確答案</Label>
                <Input
                  placeholder="輸入正確答案（多個答案用逗號分隔）"
                  value={Array.isArray(answer) ? answer.join(", ") : answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  多個答案請用逗號分隔，例如：答案1, 答案2
                </p>
              </div>
            )}

            {/* 問答題參考答案 */}
            {selectedType?.name === "essay" && (
              <div className="space-y-2">
                <Label>參考答案（選填）</Label>
                <Textarea
                  placeholder="輸入參考答案..."
                  value={typeof answer === "string" ? answer : ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* 解析 */}
            <div className="space-y-2">
              <Label>解析說明（選填）</Label>
              <Textarea
                placeholder="輸入解析說明..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "處理中..." : isEdit ? "儲存" : "建立"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
