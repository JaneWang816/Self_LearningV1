// app/(dashboard)/dashboard/units/[unitId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import type { Unit, Topic, Subject } from "@/types/custom"

export default function UnitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string

  const [unit, setUnit] = useState<Unit | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

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

  useEffect(() => {
    fetchData()
  }, [unitId])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
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

      {/* 心智圖顯示區 */}
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
            <p className="text-gray-500">尚未上傳心智圖</p>
          </CardContent>
        </Card>
      )}

      {/* 補充說明 */}
      {unit.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">補充說明</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{unit.content}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
