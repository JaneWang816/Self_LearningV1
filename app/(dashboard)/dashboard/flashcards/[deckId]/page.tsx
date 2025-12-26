// app/(dashboard)/dashboard/flashcards/[deckId]/page.tsx
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
import {
  ArrowLeft,
  Plus,
  Play,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  RotateCcw,
  Upload,
  ClipboardList,
} from "lucide-react"
import { FlashcardImport } from "@/components/flashcards/flashcard-import"
import { getNextReviewText } from "@/lib/sm2"
import type { Deck, Flashcard } from "@/types/custom"

export default function DeckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // 表單狀態
  const [formOpen, setFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [saving, setSaving] = useState(false)

  // 刪除狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 匯入對話框
  const [importOpen, setImportOpen] = useState(false)

  // 篩選狀態
  const [filter, setFilter] = useState<"all" | "due" | "learned">("all")

  // 待複習數量
  const [dueCount, setDueCount] = useState(0)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得卡片組
    const { data: deckData } = await supabase
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single()

    if (!deckData) {
      router.push("/dashboard/flashcards")
      return
    }
    setDeck(deckData)

    // 取得卡片
    await fetchCards()

    setLoading(false)
  }

  const fetchCards = async () => {
    const { data: cardsData } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false })

    if (cardsData) {
      setCards(cardsData)

      // 計算待複習數量
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      const due = cardsData.filter(
        (c) => new Date(c.next_review_at || 0) <= today
      ).length
      setDueCount(due)
    }
  }

  useEffect(() => {
    fetchData()
  }, [deckId])

  // 開啟新增表單
  const openCreateForm = () => {
    setEditingCard(null)
    setFront("")
    setBack("")
    setFormOpen(true)
  }

  // 開啟編輯表單
  const openEditForm = (card: Flashcard) => {
    setEditingCard(card)
    setFront(card.front)
    setBack(card.back)
    setFormOpen(true)
  }

  // 儲存卡片
  const handleSave = async () => {
    if (!front.trim() || !back.trim()) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    if (editingCard) {
      // 更新
      await supabase
        .from("flashcards")
        .update({
          front: front.trim(),
          back: back.trim(),
        })
        .eq("id", editingCard.id)
    } else {
      // 新增
      await supabase
        .from("flashcards")
        .insert({
          user_id: user.id,
          deck_id: deckId,
          front: front.trim(),
          back: back.trim(),
          next_review_at: new Date().toISOString(),
          interval: 0,
          ease_factor: 2.5,
          repetition_count: 0,
        })
    }

    setSaving(false)
    setFormOpen(false)
    fetchCards()
  }

  // 開啟刪除確認
  const openDeleteDialog = (card: Flashcard) => {
    setDeletingCard(card)
    setDeleteDialogOpen(true)
  }

  // 刪除卡片
  const handleDelete = async () => {
    if (!deletingCard) return

    setDeleteLoading(true)

    await supabase
      .from("flashcards")
      .delete()
      .eq("id", deletingCard.id)

    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeletingCard(null)
    fetchCards()
  }

  // 重設卡片進度
  const resetCard = async (card: Flashcard) => {
    await supabase
      .from("flashcards")
      .update({
        next_review_at: new Date().toISOString(),
        interval: 0,
        ease_factor: 2.5,
        repetition_count: 0,
      })
      .eq("id", card.id)

    fetchCards()
  }

  // 開始複習
  const startReview = () => {
    router.push(`/dashboard/flashcards/${deckId}/review`)
  }

  // 計算卡片狀態
  const getCardStatus = (card: Flashcard) => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const nextReview = new Date(card.next_review_at || 0)

    if (nextReview <= today) {
      return { text: "待複習", color: "text-amber-600 bg-amber-100" }
    }

    const daysUntil = Math.ceil(
      (nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      text: getNextReviewText(daysUntil),
      color: "text-green-600 bg-green-100",
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!deck) return null

  return (
    <div className="space-y-6">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/flashcards">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{deck.title}</h1>
            {deck.description && (
              <p className="text-gray-600 mt-1">{deck.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            批次匯入
          </Button>
          <Button
            variant="outline"
            onClick={openCreateForm}
          >
            <Plus className="w-4 h-4 mr-2" />
            新增卡片
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={startReview}
            disabled={cards.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            {dueCount > 0 ? `複習 (${dueCount})` : "複習"}
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => router.push(`/dashboard/flashcards/${deckId}/test`)}
            disabled={cards.length < 4}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            測驗
          </Button>
        </div>
      </div>

      {/* 篩選按鈕 */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "all"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            全部 ({cards.length})
          </button>
          <button
            onClick={() => setFilter("due")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "due"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            待複習 ({dueCount})
          </button>
          <button
            onClick={() => setFilter("learned")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "learned"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            已排程 ({cards.length - dueCount})
          </button>
        </div>
      </div>

      {/* 卡片列表 */}
      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              尚未建立卡片
            </h3>
            <p className="text-gray-600 text-center mb-4">
              開始新增記憶卡片吧！
            </p>
            <Button
              onClick={openCreateForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增卡片
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards
            .filter((card) => {
              if (filter === "all") return true
              const today = new Date()
              today.setHours(23, 59, 59, 999)
              const isDue = new Date(card.next_review_at || 0) <= today
              if (filter === "due") return isDue
              if (filter === "learned") return !isDue
              return true
            })
            .map((card) => (
            <FlashcardItem
              key={card.id}
              card={card}
              status={getCardStatus(card)}
              onEdit={() => openEditForm(card)}
              onDelete={() => openDeleteDialog(card)}
              onReset={() => resetCard(card)}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "編輯卡片" : "新增卡片"}
            </DialogTitle>
            <DialogDescription>
              輸入卡片正面（問題）和背面（答案）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">正面（問題）*</Label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="例如：apple"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">背面（答案）*</Label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="例如：蘋果"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!front.trim() || !back.trim() || saving}
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
              刪除此卡片後無法復原。
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

      {/* 批次匯入對話框 */}
      <FlashcardImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => fetchCards()}
        deckId={deckId}
      />
    </div>
  )
}

// 卡片項目元件
function FlashcardItem({
  card,
  status,
  onEdit,
  onDelete,
  onReset,
}: {
  card: Flashcard
  status: { text: string; color: string }
  onEdit: () => void
  onDelete: () => void
  onReset: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [flipped, setFlipped] = useState(false)

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 卡片內容 */}
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>
                {status.text}
              </span>
              <span className="text-xs text-gray-400">
                點擊翻轉
              </span>
            </div>

            {!flipped ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">正面</p>
                <p className="text-gray-800 whitespace-pre-wrap">{card.front}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-1">背面</p>
                <p className="text-gray-800 whitespace-pre-wrap">{card.back}</p>
              </div>
            )}

            {/* 學習統計 */}
            {(card.repetition_count || 0) > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                已複習 {card.repetition_count} 次 · 間隔 {card.interval} 天
              </div>
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
                <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-md shadow-lg border py-1">
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
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setShowMenu(false)
                      onReset()
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重設進度
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
      </CardContent>
    </Card>
  )
}
