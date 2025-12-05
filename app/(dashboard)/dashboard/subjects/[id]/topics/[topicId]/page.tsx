// app/(dashboard)/dashboard/subjects/[id]/topics/[topicId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, FileImage, MoreVertical, Pencil, Trash2, Image, X } from "lucide-react"
import type { Subject, Topic, Unit } from "@/types/supabase"

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string
  const topicId = params.topicId as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  // 表單相關 state
  const [formOpen, setFormOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [unitTitle, setUnitTitle] = useState("")
  const [unitContent, setUnitContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // 刪除相關 state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得科目
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .eq("user_id", user.id)
      .single()

    if (!subjectData) {
      router.push("/dashboard/subjects")
      return
    }
    setSubject(subjectData)

    // 取得主題
    const { data: topicData } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .eq("subject_id", subjectId)
      .single()

    if (!topicData) {
      router.push(`/dashboard/subjects/${subjectId}`)
      return
    }
    setTopic(topicData)

    // 取得單元列表
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .eq("topic_id", topicId)
      .order("order", { ascending: true })

    if (unitsData) {
      setUnits(unitsData)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [subjectId, topicId])

  // 開啟新增/編輯表單
  const openForm = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit)
      setUnitTitle(unit.title)
      setUnitContent(unit.content || "")
      setImagePreview(unit.mindmap_url || null)
    } else {
      setEditingUnit(null)
      setUnitTitle("")
      setUnitContent("")
      setImagePreview(null)
    }
    setImageFile(null)
    setFormError(null)
    setFormOpen(true)
  }

  // 關閉表單
  const closeForm = () => {
    setFormOpen(false)
    setEditingUnit(null)
    setUnitTitle("")
    setUnitContent("")
    setImageFile(null)
    setImagePreview(null)
    setFormError(null)
  }

  // 處理圖片選擇
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 檢查檔案類型
      if (!file.type.startsWith("image/")) {
        setFormError("請選擇圖片檔案")
        return
      }
      // 檢查檔案大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError("圖片大小不能超過 5MB")
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setFormError(null)
    }
  }

  // 移除圖片
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // 上傳圖片到 Supabase Storage
  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("mindmaps")
      .upload(fileName, file)

    if (error) {
      console.error("上傳失敗:", error)
      return null
    }

    const { data } = supabase.storage
      .from("mindmaps")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // 新增/編輯單元
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitTitle.trim()) {
      setFormError("請輸入單元名稱")
      return
    }

    setFormLoading(true)
    setFormError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("未登入")

      let mindmapUrl = editingUnit?.mindmap_url || null

      // 如果有新圖片，上傳它
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, user.id)
        if (!uploadedUrl) {
          throw new Error("圖片上傳失敗")
        }
        mindmapUrl = uploadedUrl
      }

      // 如果移除了圖片
      if (!imagePreview && editingUnit?.mindmap_url) {
        mindmapUrl = null
      }

      if (editingUnit) {
        // 編輯
        const { error } = await supabase
          .from("units")
          .update({
            title: unitTitle.trim(),
            content: unitContent.trim() || null,
            mindmap_url: mindmapUrl,
          })
          .eq("id", editingUnit.id)

        if (error) throw error
      } else {
        // 新增
        const { error } = await supabase.from("units").insert({
          topic_id: topicId,
          user_id: user.id,
          title: unitTitle.trim(),
          content: unitContent.trim() || null,
          mindmap_url: mindmapUrl,
          order: units.length,
        })

        if (error) throw error
      }

      closeForm()
      await fetchData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "操作失敗，請稍後再試")
    } finally {
      setFormLoading(false)
    }
  }

  // 開啟刪除確認
  const openDeleteDialog = (unit: Unit) => {
    setDeletingUnit(unit)
    setDeleteDialogOpen(true)
  }

  // 刪除單元
  const handleDelete = async () => {
    if (!deletingUnit) return

    setDeleteLoading(true)
    const { error } = await supabase.from("units").delete().eq("id", deletingUnit.id)

    if (!error) {
      await fetchData()
    }

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingUnit(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!subject || !topic) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/subjects/${subjectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-gray-500">{subject.title}</p>
            <h1 className="text-2xl font-bold text-gray-800">{topic.title}</h1>
          </div>
        </div>
        <Button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增單元
        </Button>
      </div>

      {/* 單元列表 */}
      {units.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileImage className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              尚未建立單元
            </h3>
            <p className="text-gray-600 text-center mb-4">
              為「{topic.title}」建立學習單元，可上傳心智圖！
            </p>
            <Button
              onClick={() => openForm()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增單元
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onEdit={() => openForm(unit)}
              onDelete={() => openDeleteDialog(unit)}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯表單 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "編輯單元" : "新增單元"}
              </DialogTitle>
              <DialogDescription>
                {editingUnit ? "修改單元內容" : "建立新的學習單元，可上傳心智圖"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {formError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="unitTitle">單元名稱 *</Label>
                <Input
                  id="unitTitle"
                  placeholder="例如：1-1 因數與倍數"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitContent">補充說明（選填）</Label>
                <Textarea
                  id="unitContent"
                  placeholder="簡單描述這個單元的重點..."
                  value={unitContent}
                  onChange={(e) => setUnitContent(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>心智圖（選填）</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="心智圖預覽"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Image className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">點擊上傳心智圖</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG（最大 5MB）</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={formLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={formLoading}
              >
                {formLoading ? "處理中..." : editingUnit ? "儲存" : "建立"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除「{deletingUnit?.title}」後，此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
            >
              {deleteLoading ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 單元卡片元件
function UnitCard({
  unit,
  onEdit,
  onDelete,
}: {
  unit: Unit
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="group relative hover:shadow-md transition-shadow overflow-hidden">
      {/* 選單按鈕 */}
      <div className="absolute top-2 right-2 z-10">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-md shadow-lg border py-1">
                <button
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowMenu(false)
                    onEdit()
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  編輯
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setShowMenu(false)
                    onDelete()
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 心智圖預覽 */}
      <Link href={`/dashboard/units/${unit.id}`}>
        {unit.mindmap_url ? (
          <div className="h-40 overflow-hidden">
            <img
              src={unit.mindmap_url}
              alt={unit.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-40 bg-gray-100 flex items-center justify-center">
            <FileImage className="w-12 h-12 text-gray-300" />
          </div>
        )}

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-1">{unit.title}</h3>
          {unit.content && (
            <p className="text-sm text-gray-600 line-clamp-2">{unit.content}</p>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
