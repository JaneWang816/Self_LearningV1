// app/(dashboard)/dashboard/flashcards/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Layers,
  Plus,
  Play,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Volume2,
} from "lucide-react"
import { supportedLanguages, type LanguageCode } from "@/lib/speech"
import type { Deck, Flashcard } from "@/types/custom"

interface DeckWithStats extends Deck {
  totalCards: number
  dueCards: number
}

export default function FlashcardsPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<DeckWithStats[]>([])
  const [loading, setLoading] = useState(true)

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [frontLang, setFrontLang] = useState<LanguageCode>("auto")
  const [backLang, setBackLang] = useState<LanguageCode>("auto")
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 今日待複習總數
  const [totalDueToday, setTotalDueToday] = useState(0)

  // 載入資料
  const fetchDecks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得所有卡片組
    const { data: decksData } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!decksData) {
      setLoading(false)
      return
    }

    // 取得每個卡片組的統計
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const decksWithStats: DeckWithStats[] = await Promise.all(
      decksData.map(async (deck) => {
        // 總卡片數
        const { count: totalCards } = await supabase
          .from("flashcards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id)

        // 今日待複習數
        const { count: dueCards } = await supabase
          .from("flashcards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id)
          .lte("next_review_at", today.toISOString())

        return {
          ...deck,
          totalCards: totalCards || 0,
          dueCards: dueCards || 0,
        }
      })
    )

    setDecks(decksWithStats)
    setTotalDueToday(decksWithStats.reduce((sum, d) => sum + d.dueCards, 0))
    setLoading(false)
  }

  useEffect(() => {
    fetchDecks()
  }, [])

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingDeck(null)
    setTitle("")
    setDescription("")
    setFrontLang("auto")
    setBackLang("auto")
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (deck: Deck) => {
    setEditingDeck(deck)
    setTitle(deck.title)
    setDescription(deck.description || "")
    setFrontLang(((deck as any).front_lang as LanguageCode) || "auto")
    setBackLang(((deck as any).back_lang as LanguageCode) || "auto")
    setFormOpen(true)
  }

  // 儲存卡片組
  const handleSave = async () => {
    if (!title.trim()) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    if (editingDeck) {
      // 更新
      await supabase
        .from("decks")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          front_lang: frontLang,
          back_lang: backLang,
        })
        .eq("id", editingDeck.id)
    } else {
      // 新增
      await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          front_lang: frontLang,
          back_lang: backLang,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchDecks()
  }

  // 開啟刪除確認
  const openDeleteDialog = (deck: Deck) => {
    setDeletingDeck(deck)
    setDeleteDialogOpen(true)
  }

  // 刪除卡片組
  const handleDelete = async () => {
    if (!deletingDeck) return

    setDeleteLoading(true)

    // 先刪除卡片組內的卡片
    await supabase
      .from("flashcards")
      .delete()
      .eq("deck_id", deletingDeck.id)

    // 再刪除卡片組
    await supabase
      .from("decks")
      .delete()
      .eq("id", deletingDeck.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingDeck(null)
    fetchDecks()
  }

  // 開始複習
  const startReview = (deckId: string) => {
    router.push(`/dashboard/flashcards/${deckId}/review`)
  }

  // 管理卡片
  const manageCards = (deckId: string) => {
    router.push(`/dashboard/flashcards/${deckId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">記憶卡片</h1>
          <p className="text-gray-600 mt-1">使用間隔重複法有效記憶</p>
        </div>
        <Button
          onClick={openCreateForm}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增卡片組
        </Button>
      </div>

      {/* 今日待複習提示 */}
      {totalDueToday > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">今日待複習</p>
                <p className="text-sm text-amber-600">
                  共 {totalDueToday} 張卡片需要複習
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 卡片組列表 */}
      {decks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              尚未建立卡片組
            </h3>
            <p className="text-gray-600 text-center mb-4">
              建立卡片組來開始記憶學習吧！
            </p>
            <Button
              onClick={openCreateForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增卡片組
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onReview={() => startReview(deck.id)}
              onManage={() => manageCards(deck.id)}
              onEdit={() => openEditForm(deck)}
              onDelete={() => openDeleteDialog(deck)}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDeck ? "編輯卡片組" : "新增卡片組"}
            </DialogTitle>
            <DialogDescription>
              {editingDeck ? "修改卡片組資訊" : "建立新的卡片組來整理記憶卡片"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">名稱 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：西班牙語單字、英文片語"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">說明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="選填，簡短描述這個卡片組"
                rows={2}
              />
            </div>

            {/* 語音語言設定 */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">語音朗讀設定</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>正面語言</Label>
                  <Select value={frontLang} onValueChange={(v) => setFrontLang(v as LanguageCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>背面語言</Label>
                  <Select value={backLang} onValueChange={(v) => setBackLang(v as LanguageCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                選擇「自動偵測」會根據內容判斷，但英西相似單詞可能誤判
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除「{deletingDeck?.title}」後，內含的所有卡片也會一併刪除，無法復原。
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

// 卡片組卡片元件
function DeckCard({
  deck,
  onReview,
  onManage,
  onEdit,
  onDelete,
}: {
  deck: DeckWithStats
  onReview: () => void
  onManage: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* 標題列 */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex-1 cursor-pointer"
            onClick={onManage}
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {deck.title}
            </h3>
            {deck.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {deck.description}
              </p>
            )}
          </div>

          {/* 選單 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* 統計 */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            <span>{deck.totalCards} 張</span>
          </div>
          {deck.dueCards > 0 ? (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>{deck.dueCards} 待複習</span>
            </div>
          ) : deck.totalCards > 0 ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>已完成</span>
            </div>
          ) : null}
        </div>

        {/* 按鈕 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onManage}
          >
            管理卡片
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={onReview}
            disabled={deck.totalCards === 0}
          >
            <Play className="w-4 h-4 mr-1" />
            {deck.dueCards > 0 ? `複習 (${deck.dueCards})` : "複習"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
