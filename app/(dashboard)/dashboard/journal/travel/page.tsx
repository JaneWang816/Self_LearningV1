// app/(dashboard)/dashboard/journal/travel/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { zhTW } from "date-fns/locale"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Compass,
  Plus,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Star,
  Upload,
  X,
  Smile,
  Meh,
  Frown,
  Calendar,
} from "lucide-react"

// 類型定義
type JournalTravel = {
  id: string
  user_id: string
  date: string
  title: string
  location: string
  duration_minutes: number | null
  content: string | null
  mood: number | null
  weather: string | null
  companions: string | null
  rating: number | null
  photos: string[] | null
  created_at: string
  updated_at: string
}

// 常量
const MOOD_CONFIG = {
  1: { label: "很差", color: "text-red-500", emoji: "😢" },
  2: { label: "不好", color: "text-orange-500", emoji: "😕" },
  3: { label: "普通", color: "text-yellow-500", emoji: "😐" },
  4: { label: "不錯", color: "text-lime-500", emoji: "🙂" },
  5: { label: "很棒", color: "text-green-500", emoji: "😄" },
}

const WEATHER_OPTIONS = ["☀️ 晴天", "⛅ 多雲", "☁️ 陰天", "🌧️ 雨天", "⛈️ 雷雨", "🌨️ 雪天", "🌫️ 霧"]
const COMPANION_OPTIONS = ["👤 獨自", "👨‍👩‍👧 家人", "👫 朋友", "💑 情侶", "👥 同學", "🏢 同事", "🎒 團體旅遊"]

export default function TravelJournalPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [journals, setJournals] = useState<JournalTravel[]>([])
  const [loading, setLoading] = useState(true)

  // 對話框
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 刪除確認
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; photos?: string[] } | null>(null)

  // 載入當月日誌
  const fetchJournals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd")
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd")

    const { data } = await supabase
      .from("journals_travel")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    setJournals((data || []) as JournalTravel[])
    setLoading(false)
  }, [currentMonth])

  useEffect(() => {
    fetchJournals()
  }, [fetchJournals])

  // 開啟對話框
  const openDialog = (data?: JournalTravel) => {
    setFormData(data || { date: format(new Date(), "yyyy-MM-dd") })
    setPhotoUrls(data?.photos || [])
    setDialogOpen(true)
  }

  // 照片上傳
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (photoUrls.length + files.length > 3) {
      alert("最多只能上傳 3 張照片")
      return
    }

    setUploadingPhotos(true)

    try {
      const newUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue
        if (file.size > 5 * 1024 * 1024) {
          alert("圖片大小不能超過 5MB")
          continue
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        const { error } = await supabase.storage.from("travel-photos").upload(fileName, file)
        if (error) continue

        const { data: urlData } = supabase.storage.from("travel-photos").getPublicUrl(fileName)
        if (urlData.publicUrl) newUrls.push(urlData.publicUrl)
      }

      setPhotoUrls([...photoUrls, ...newUrls])
    } catch (error) {
      console.error("上傳錯誤:", error)
    }

    setUploadingPhotos(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = async (url: string) => {
    const path = url.split("/travel-photos/")[1]
    if (path) await supabase.storage.from("travel-photos").remove([path])
    setPhotoUrls(photoUrls.filter(u => u !== url))
  }

  // 儲存
  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    try {
      const payload = {
        title: formData.title,
        location: formData.location,
        date: formData.date,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        content: formData.content || null,
        mood: formData.mood || null,
        weather: formData.weather || null,
        companions: formData.companions || null,
        rating: formData.rating || null,
        photos: photoUrls,
      }

      if (formData.id) {
        await supabase.from("journals_travel").update(payload).eq("id", formData.id)
      } else {
        await supabase.from("journals_travel").insert({ ...payload, user_id: user.id })
      }
      fetchJournals()
    } catch (error) {
      console.error("儲存失敗:", error)
    }

    setSaving(false)
    setDialogOpen(false)
    setFormData({})
    setPhotoUrls([])
  }

  // 刪除
  const handleDelete = async () => {
    if (!deleteTarget) return

    if (deleteTarget.photos && deleteTarget.photos.length > 0) {
      const paths = deleteTarget.photos.map(url => url.split("/travel-photos/")[1]).filter(Boolean)
      if (paths.length > 0) await supabase.storage.from("travel-photos").remove(paths)
    }

    await supabase.from("journals_travel").delete().eq("id", deleteTarget.id)
    setDeleteTarget(null)
    fetchJournals()
  }

  // 格式化時長
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} 分鐘`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`
  }

  const getMoodIcon = (mood: number) => {
    if (mood <= 2) return Frown
    if (mood === 3) return Meh
    return Smile
  }

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Compass className="w-7 h-7 text-sky-600" />
          遊覽日誌
        </h1>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" /> 新增日誌
        </Button>
      </div>

      {/* 月份導覽 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "yyyy年 M月", { locale: zhTW })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 日誌列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : journals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">這個月還沒有遊覽記錄</p>
          <Button className="mt-4" onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" /> 記錄第一筆遊覽
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journals.map((journal) => (
            <div key={journal.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* 照片 */}
              {journal.photos && journal.photos.length > 0 && (
                <div className={`grid ${journal.photos.length === 1 ? "" : journal.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"} gap-1`}>
                  {journal.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full h-32 object-cover cursor-pointer hover:opacity-90"
                      onClick={() => window.open(url, "_blank")}
                    />
                  ))}
                </div>
              )}

              <div className="p-4">
                {/* 標題和日期 */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{journal.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(journal.date), "M/d EEEE", { locale: zhTW })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {journal.location}
                      </span>
                      {journal.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {formatDuration(journal.duration_minutes)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(journal)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => setDeleteTarget({ id: journal.id, photos: journal.photos || undefined })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* 標籤 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {journal.weather && (
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{journal.weather}</span>
                  )}
                  {journal.companions && (
                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">{journal.companions}</span>
                  )}
                  {journal.mood && (
                    <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                      {MOOD_CONFIG[journal.mood as keyof typeof MOOD_CONFIG]?.emoji}{" "}
                      {MOOD_CONFIG[journal.mood as keyof typeof MOOD_CONFIG]?.label}
                    </span>
                  )}
                  {journal.rating && (
                    <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded flex items-center gap-1">
                      <Star className="w-3 h-3" /> {journal.rating}/5
                    </span>
                  )}
                </div>

                {/* 內容 */}
                {journal.content && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{journal.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>{formData.id ? "編輯遊覽日誌" : "新增遊覽日誌"}</DialogTitle>
            <DialogDescription>記錄你的旅程</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 日期 */}
            <div className="space-y-1">
              <Label className="text-xs">日期 *</Label>
              <Input
                type="date"
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-9"
              />
            </div>

            {/* 標題 */}
            <div className="space-y-1">
              <Label className="text-xs">標題 *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例：台北動物園一日遊"
                className="h-9"
              />
            </div>

            {/* 地點 */}
            <div className="space-y-1">
              <Label className="text-xs">地點 *</Label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="例：台北市立動物園"
                className="h-9"
              />
            </div>

            {/* 停留時間 & 天氣 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">停留（分鐘）</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes || ""}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="180"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">天氣</Label>
                <Select value={formData.weather || ""} onValueChange={(v) => setFormData({ ...formData, weather: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="選擇" /></SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 同行者 */}
            <div className="space-y-1">
              <Label className="text-xs">同行者</Label>
              <Select value={formData.companions || ""} onValueChange={(v) => setFormData({ ...formData, companions: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="選擇" /></SelectTrigger>
                <SelectContent>
                  {COMPANION_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 心情 & 推薦度 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">心情</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((m) => {
                    const config = MOOD_CONFIG[m as keyof typeof MOOD_CONFIG]
                    const MoodIcon = getMoodIcon(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, mood: m })}
                        className={`p-1.5 rounded border transition-all ${
                          formData.mood === m ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        title={config.label}
                      >
                        <MoodIcon className={`w-4 h-4 ${config.color}`} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">推薦度</Label>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: r })}
                      className={`text-lg transition-transform hover:scale-110 ${
                        (formData.rating || 0) >= r ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 心得 */}
            <div className="space-y-1">
              <Label className="text-xs">心得</Label>
              <Textarea
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={2}
                placeholder="記錄今天的遊覽心得..."
                className="resize-none"
              />
            </div>

            {/* 照片 */}
            <div className="space-y-1">
              <Label className="text-xs">照片（最多 3 張）</Label>
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photoUrls.length < 3 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos}
                    className="w-full"
                  >
                    {uploadingPhotos ? "上傳中..." : <><Upload className="w-3 h-3 mr-1" /> 上傳照片</>}
                  </Button>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !formData.title || !formData.location || !formData.date}>
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除？</AlertDialogTitle>
            <AlertDialogDescription>此操作會刪除日誌及相關照片，無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
