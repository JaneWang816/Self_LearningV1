// app/(dashboard)/dashboard/subjects/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SubjectCard } from "@/components/subjects/subject-card"
import { SubjectForm } from "@/components/subjects/subject-form"
import { BookOpen, Plus } from "lucide-react"
import type { Subject } from "@/types/supabase"

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  // 載入科目列表
  const fetchSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setSubjects(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  // 新增科目
  const handleCreate = async (data: { title: string; description: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("未登入")

    const { error } = await supabase.from("subjects").insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
    })

    if (error) throw error
    await fetchSubjects()
  }

  // 編輯科目
  const handleEdit = async (data: { title: string; description: string }) => {
    if (!editingSubject) return

    const { error } = await supabase
      .from("subjects")
      .update({
        title: data.title,
        description: data.description,
      })
      .eq("id", editingSubject.id)

    if (error) throw error
    setEditingSubject(null)
    await fetchSubjects()
  }

  // 刪除科目
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id)
    if (error) {
      console.error("刪除失敗:", error)
      return
    }
    await fetchSubjects()
  }

  // 開啟編輯表單
  const openEditForm = (subject: Subject) => {
    setEditingSubject(subject)
    setFormOpen(true)
  }

  // 關閉表單
  const closeForm = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingSubject(null)
    }
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
          <h1 className="text-2xl font-bold text-gray-800">科目管理</h1>
          <p className="text-gray-600 mt-1">管理你的學習科目</p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增科目
        </Button>
      </div>

      {/* 科目列表 */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              尚未建立科目
            </h3>
            <p className="text-gray-600 text-center mb-4">
              開始建立你的第一個學習科目吧！
            </p>
            <Button
              onClick={() => setFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增科目
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯表單 */}
      <SubjectForm
        open={formOpen}
        onOpenChange={closeForm}
        onSubmit={editingSubject ? handleEdit : handleCreate}
        subject={editingSubject}
      />
    </div>
  )
}
