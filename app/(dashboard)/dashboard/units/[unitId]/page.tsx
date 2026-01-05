// app/(dashboard)/dashboard/units/[unitId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { NoteCard } from "@/components/study/note-card"
import { NoteDialog } from "@/components/study/note-dialog"
import { NoteLinkDialog } from "@/components/study/note-link-dialog"
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  Plus,
  FileText,
  Brain,
  StickyNote,
  Pencil,
  Save,
  X,
} from "lucide-react"
import type { Unit, Topic, Subject, UnitNote, NoteCategoryType } from "@/types/custom"

export default function UnitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string

  const [unit, setUnit] = useState<Unit | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 心智圖控制
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  
  // 筆記相關
  const [notes, setNotes] = useState<UnitNote[]>([])
  const [noteLinks, setNoteLinks] = useState<Record<string, number>>({})
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<UnitNote | null>(null)
  const [linkingNote, setLinkingNote] = useState<UnitNote | null>(null)

  // 補充說明編輯
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [contentDraft, setContentDraft] = useState("")
  const [savingContent, setSavingContent] = useState(false)

  // 載入資料
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 取得單元
    const { data: unitData } = await supabase
      .from("units")
      .select("*")
      .eq("id", unitId)
      .eq("user_id", user.id)
      .single()

    if (!unitData) {
      router.push("/dashboard/subjects")
      return
    }
    setUnit(unitData)

    // 取得主題
    const { data: topicData } = await supabase
      .from("topics")
      .select("*")
      .eq("id", unitData.topic_id)
      .single()

    if (topicData) {
      setTopic(topicData)

      // 取得科目
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", topicData.subject_id)
        .single()

      if (subjectData) {
        setSubject(subjectData)
      }
    }

    setLoading(false)
  }

  // 載入筆記
  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: notesData } = await supabase
      .from("unit_notes")
      .select("*")
      .eq("unit_id", unitId)
      .eq("user_id", user.id)
      .order("order", { ascending: true })

    if (notesData) {
      // 轉換為 UnitNote 類型
      const typedNotes: UnitNote[] = notesData.map((n) => ({
        ...n,
        category: n.category as NoteCategoryType,
        is_important: n.is_important ?? false,
        order: n.order ?? 0,
        created_at: n.created_at ?? '',
        updated_at: n.updated_at ?? '',
      }))
      setNotes(typedNotes)

      // 取得每則筆記的連結數量
      const noteIds = typedNotes.map((n) => n.id)
      if (noteIds.length > 0) {
        const { data: linksData } = await supabase
          .from("note_links")
          .select("note_id")
          .in("note_id", noteIds)

        if (linksData) {
          const counts: Record<string, number> = {}
          linksData.forEach((link) => {
            counts[link.note_id] = (counts[link.note_id] || 0) + 1
          })
          setNoteLinks(counts)
        }
      }
    }
  }

  useEffect(() => {
    fetchData()
    fetchNotes()
  }, [unitId])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleEditNote = (note: UnitNote) => {
    setEditingNote(note)
    setNoteDialogOpen(true)
  }

  const handleNewNote = () => {
    setEditingNote(null)
    setNoteDialogOpen(true)
  }

  const handleLinkClick = (note: UnitNote) => {
    setLinkingNote(note)
    setLinkDialogOpen(true)
  }

  // 補充說明編輯功能
  const handleStartEditContent = () => {
    setContentDraft(unit?.content || "")
    setIsEditingContent(true)
  }

  const handleCancelEditContent = () => {
    setIsEditingContent(false)
    setContentDraft("")
  }

  const handleSaveContent = async () => {
    if (!unit) return
    
    setSavingContent(true)
    const { error } = await supabase
      .from("units")
      .update({ content: contentDraft.trim() || null })
      .eq("id", unit.id)

    if (error) {
      console.error("儲存失敗:", error)
      alert("儲存失敗")
      setSavingContent(false)
      return
    }

    // 更新本地狀態
    setUnit({ ...unit, content: contentDraft.trim() || null })
    setIsEditingContent(false)
    setContentDraft("")
    setSavingContent(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!unit || !topic || !subject) {
    return null
  }

  const backUrl = `/dashboard/subjects/${subject.id}/topics/${topic.id}`

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-gray-500">
              {subject.title} / {topic.title}
            </p>
            <h1 className="text-2xl font-bold text-gray-800">{unit.title}</h1>
          </div>
        </div>
      </div>

      {/* Tab 切換 */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mindmap" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            心智圖
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            筆記整理
            {notes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {notes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            補充說明
          </TabsTrigger>
        </TabsList>

        {/* 心智圖 Tab */}
        <TabsContent value="mindmap" className="mt-6">
          {unit.mindmap_url ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">心智圖</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button variant="outline" size="icon" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRotate}>
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      重置
                    </Button>
                    <a href={unit.mindmap_url} download target="_blank">
                      <Button variant="outline" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto border rounded-lg bg-gray-50 p-4" style={{ maxHeight: "70vh" }}>
                  <div className="flex items-center justify-center min-h-[400px]">
                    <img
                      src={unit.mindmap_url}
                      alt={unit.title}
                      className="transition-transform duration-200"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">尚未上傳心智圖</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 筆記整理 Tab */}
        <TabsContent value="notes" className="mt-6">
          <div className="space-y-4">
            {/* 新增按鈕 */}
            <div className="flex justify-end">
              <Button onClick={handleNewNote} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新增筆記
              </Button>
            </div>

            {/* 筆記列表 */}
            {notes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <StickyNote className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">尚未建立任何筆記</p>
                  <Button onClick={handleNewNote} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    建立第一則筆記
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDeleted={fetchNotes}
                    onLinkClick={handleLinkClick}
                    linkedCount={noteLinks[note.id] || 0}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 補充說明 Tab */}
        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">補充說明</CardTitle>
                {!isEditingContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartEditContent}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    編輯
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingContent ? (
                <div className="space-y-4">
                  <Textarea
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    placeholder="輸入補充說明、備註..."
                    rows={8}
                    className="resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditContent}
                      disabled={savingContent}
                    >
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveContent}
                      disabled={savingContent}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {savingContent ? "儲存中..." : "儲存"}
                    </Button>
                  </div>
                </div>
              ) : unit.content ? (
                <p className="text-gray-700 whitespace-pre-wrap">{unit.content}</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">尚未新增補充說明</p>
                  <Button variant="outline" onClick={handleStartEditContent}>
                    <Pencil className="w-4 h-4 mr-2" />
                    新增說明
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 筆記對話框 */}
      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        unitId={unitId}
        note={editingNote}
        onSaved={fetchNotes}
      />

      {/* 連結對話框 */}
      <NoteLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        note={linkingNote}
        subjectId={subject.id}
        onUpdated={fetchNotes}
      />
    </div>
  )
}
