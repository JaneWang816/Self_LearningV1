// app/(dashboard)/dashboard/health/stats/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Scale,
  Heart,
  Footprints,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"

// 類型定義
interface HealthMetric {
  id: string
  date: string
  metric_type: string
  value_primary: number
  value_secondary: number | null
  value_tertiary: number | null
  measured_time: string | null
}

interface ProfileHealth {
  birth_year: number | null
  height_cm: number | null
  gender: string | null
}

interface HealthAdvice {
  type: "success" | "warning" | "info"
  title: string
  message: string
}

// 顏色
const COLORS = {
  weight: "#3b82f6",
  bloodPressure: "#ef4444",
  bloodPressureLow: "#f97316",
  steps: "#22c55e",
  sleep: "#8b5cf6",
}

export default function HealthStatsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<30 | 90 | 180>(30)
  
  // 用戶資料
  const [profile, setProfile] = useState<ProfileHealth | null>(null)
  
  // 健康數據
  const [weightData, setWeightData] = useState<HealthMetric[]>([])
  const [bloodPressureData, setBloodPressureData] = useState<HealthMetric[]>([])
  const [stepsData, setStepsData] = useState<HealthMetric[]>([])
  const [sleepData, setSleepData] = useState<HealthMetric[]>([])

  // 載入數據
  const loadData = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // 載入用戶健康資料
    const { data: profileData } = await supabase
      .from("profiles")
      .select("birth_year, height_cm, gender")
      .eq("id", user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }

    // 計算日期範圍
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)
    const startDateStr = startDate.toISOString().split("T")[0]

    // 載入各類健康數據
    const { data: metrics } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDateStr)
      .order("date", { ascending: true })

    if (metrics) {
      setWeightData(metrics.filter(m => m.metric_type === "weight"))
      setBloodPressureData(metrics.filter(m => m.metric_type === "blood_pressure"))
      setStepsData(metrics.filter(m => m.metric_type === "steps"))
      setSleepData(metrics.filter(m => m.metric_type === "sleep"))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [timeRange])

  // 計算年齡
  const calculateAge = () => {
    if (!profile?.birth_year) return null
    return new Date().getFullYear() - profile.birth_year
  }

  // 計算 BMI
  const calculateBMI = () => {
    if (!profile?.height_cm || weightData.length === 0) return null
    const latestWeight = weightData[weightData.length - 1].value_primary
    const heightM = profile.height_cm / 100
    return latestWeight / (heightM * heightM)
  }

  // BMI 分類
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "體重過輕", color: "text-blue-600", bg: "bg-blue-50" }
    if (bmi < 24) return { label: "正常範圍", color: "text-green-600", bg: "bg-green-50" }
    if (bmi < 27) return { label: "過重", color: "text-amber-600", bg: "bg-amber-50" }
    return { label: "肥胖", color: "text-red-600", bg: "bg-red-50" }
  }

  // 計算趨勢
  const calculateTrend = (data: HealthMetric[]) => {
    if (data.length < 2) return "stable"
    const recent = data.slice(-7)
    if (recent.length < 2) return "stable"
    
    const first = recent[0].value_primary
    const last = recent[recent.length - 1].value_primary
    const change = ((last - first) / first) * 100

    if (change > 3) return "up"
    if (change < -3) return "down"
    return "stable"
  }

  // 生成健康建議
  const generateAdvice = (): HealthAdvice[] => {
    const advice: HealthAdvice[] = []
    const age = calculateAge()
    const bmi = calculateBMI()

    // BMI 建議
    if (bmi) {
      if (bmi < 18.5) {
        advice.push({
          type: "warning",
          title: "體重偏輕",
          message: "建議增加營養攝取，可諮詢營養師制定增重計畫。",
        })
      } else if (bmi >= 24 && bmi < 27) {
        advice.push({
          type: "warning",
          title: "體重稍微過重",
          message: "建議適度控制飲食，增加運動量。每天至少運動 30 分鐘。",
        })
      } else if (bmi >= 27) {
        advice.push({
          type: "warning",
          title: "需注意體重管理",
          message: "建議制定減重計畫，可諮詢醫師或營養師。控制高熱量食物攝取。",
        })
      } else {
        advice.push({
          type: "success",
          title: "BMI 正常",
          message: "繼續保持健康的生活習慣！",
        })
      }
    }

    // 血壓建議
    if (bloodPressureData.length > 0) {
      const latestBP = bloodPressureData[bloodPressureData.length - 1]
      const systolic = latestBP.value_primary
      const diastolic = latestBP.value_secondary || 0

      if (systolic >= 140 || diastolic >= 90) {
        advice.push({
          type: "warning",
          title: "血壓偏高",
          message: "建議減少鈉攝取、規律運動、保持健康體重。如持續偏高請諮詢醫師。",
        })
      } else if (systolic < 90 || diastolic < 60) {
        advice.push({
          type: "info",
          title: "血壓偏低",
          message: "注意是否有頭暈症狀。起身時動作放慢，多補充水分。",
        })
      } else {
        advice.push({
          type: "success",
          title: "血壓正常",
          message: "血壓維持在健康範圍內，繼續保持！",
        })
      }
    }

    // 步數建議
    if (stepsData.length > 0) {
      const avgSteps = stepsData.reduce((sum, d) => sum + d.value_primary, 0) / stepsData.length
      
      if (avgSteps < 5000) {
        advice.push({
          type: "warning",
          title: "活動量不足",
          message: "建議每天至少走 8000-10000 步。可以嘗試走路上學、課間多走動。",
        })
      } else if (avgSteps >= 10000) {
        advice.push({
          type: "success",
          title: "活動量充足",
          message: "很棒！你的日均步數達到建議標準。",
        })
      } else {
        advice.push({
          type: "info",
          title: "活動量適中",
          message: "目前活動量尚可，可嘗試再增加一些日常活動。",
        })
      }
    }

    // 睡眠建議
    if (sleepData.length > 0 && age) {
      const avgSleep = sleepData.reduce((sum, d) => sum + d.value_primary, 0) / sleepData.length
      
      // 青少年建議睡眠時間 8-10 小時
      const minSleep = age < 18 ? 8 : 7
      const maxSleep = age < 18 ? 10 : 9

      if (avgSleep < minSleep) {
        advice.push({
          type: "warning",
          title: "睡眠時間不足",
          message: `${age < 18 ? "青少年" : "成人"}建議每晚睡 ${minSleep}-${maxSleep} 小時。睡眠不足會影響專注力和學習效率。`,
        })
      } else if (avgSleep > maxSleep + 1) {
        advice.push({
          type: "info",
          title: "睡眠時間較長",
          message: "睡眠時間超過建議範圍，注意是否有嗜睡問題。",
        })
      } else {
        advice.push({
          type: "success",
          title: "睡眠充足",
          message: "睡眠時間充足，有助於學習和成長！",
        })
      }
    }

    return advice
  }

  // 圖表數據轉換
  const formatChartData = (data: HealthMetric[], type: string) => {
    return data.map(d => ({
      date: d.date.slice(5), // MM-DD
      value: d.value_primary,
      secondary: d.value_secondary,
    }))
  }

  // 統計摘要
  const getLatestValue = (data: HealthMetric[]) => {
    if (data.length === 0) return null
    return data[data.length - 1]
  }

  const getAverage = (data: HealthMetric[]) => {
    if (data.length === 0) return null
    return data.reduce((sum, d) => sum + d.value_primary, 0) / data.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const bmi = calculateBMI()
  const bmiCategory = bmi ? getBMICategory(bmi) : null
  const age = calculateAge()
  const advice = generateAdvice()

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/health">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">健康統計</h1>
            <p className="text-gray-500">追蹤你的健康趨勢</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[30, 90, 180].map((days) => (
            <Button
              key={days}
              variant={timeRange === days ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(days as 30 | 90 | 180)}
              className={timeRange === days ? "bg-pink-600" : ""}
            >
              {days}天
            </Button>
          ))}
        </div>
      </div>

      {/* BMI 卡片 */}
      {bmi && profile?.height_cm && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">身體質量指數 (BMI)</h3>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-gray-800">{bmi.toFixed(1)}</span>
                  {bmiCategory && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${bmiCategory.color} ${bmiCategory.bg}`}>
                      {bmiCategory.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  身高 {profile.height_cm} cm・
                  體重 {getLatestValue(weightData)?.value_primary || "--"} kg
                  {age && `・${age} 歲`}
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>過輕：&lt; 18.5</p>
                <p className="text-green-600 font-medium">正常：18.5 - 24</p>
                <p>過重：24 - 27</p>
                <p>肥胖：≥ 27</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 體重 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {getLatestValue(weightData)?.value_primary.toFixed(1) || "--"}
                  <span className="text-sm font-normal text-gray-500 ml-1">kg</span>
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-500">最新體重</p>
                  {weightData.length > 1 && (
                    calculateTrend(weightData) === "up" ? 
                      <TrendingUp className="w-4 h-4 text-red-500" /> :
                    calculateTrend(weightData) === "down" ?
                      <TrendingDown className="w-4 h-4 text-green-500" /> :
                      <Minus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 血壓 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {getLatestValue(bloodPressureData) 
                    ? `${getLatestValue(bloodPressureData)!.value_primary}/${getLatestValue(bloodPressureData)!.value_secondary || 0}`
                    : "--"}
                </p>
                <p className="text-sm text-gray-500">最新血壓 mmHg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 步數 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Footprints className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {getAverage(stepsData)?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "--"}
                </p>
                <p className="text-sm text-gray-500">日均步數</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 睡眠 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {getAverage(sleepData)?.toFixed(1) || "--"}
                  <span className="text-sm font-normal text-gray-500 ml-1">hr</span>
                </p>
                <p className="text-sm text-gray-500">平均睡眠</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 體重趨勢 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            體重趨勢
          </h3>
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={formatChartData(weightData, "weight")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value ?? 0} kg`, "體重"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.weight}
                  fill={COLORS.weight}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              尚無體重記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 血壓趨勢 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            血壓趨勢
          </h3>
          {bloodPressureData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={formatChartData(bloodPressureData, "blood_pressure")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[40, 180]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" label="正常收縮壓" />
                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label="正常舒張壓" />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="收縮壓"
                  stroke={COLORS.bloodPressure}
                  strokeWidth={2}
                  dot={{ fill: COLORS.bloodPressure, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="secondary"
                  name="舒張壓"
                  stroke={COLORS.bloodPressureLow}
                  strokeWidth={2}
                  dot={{ fill: COLORS.bloodPressureLow, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              尚無血壓記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 步數統計 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Footprints className="w-5 h-5 text-green-600" />
            每日步數
          </h3>
          {stepsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={formatChartData(stepsData, "steps")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [Number(value ?? 0).toLocaleString(), "步數"]}
                />
                <ReferenceLine y={10000} stroke="#22c55e" strokeDasharray="5 5" label="建議目標" />
                <Bar 
                  dataKey="value" 
                  fill={COLORS.steps} 
                  radius={[4, 4, 0, 0]}
                  name="步數"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              尚無步數記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 睡眠時間 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            睡眠時間
          </h3>
          {sleepData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={formatChartData(sleepData, "sleep")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 12]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value ?? 0} 小時`, "睡眠"]}
                />
                <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="5 5" label="建議睡眠" />
                <Bar 
                  dataKey="value" 
                  fill={COLORS.sleep} 
                  radius={[4, 4, 0, 0]}
                  name="睡眠時間"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              尚無睡眠記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 健康建議 */}
      {advice.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 健康建議</h3>
            <div className="space-y-3">
              {advice.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    item.type === "success" ? "bg-green-50" :
                    item.type === "warning" ? "bg-amber-50" :
                    "bg-blue-50"
                  }`}
                >
                  {item.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : item.type === "warning" ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      item.type === "success" ? "text-green-800" :
                      item.type === "warning" ? "text-amber-800" :
                      "text-blue-800"
                    }`}>
                      {item.title}
                    </p>
                    <p className={`text-sm mt-1 ${
                      item.type === "success" ? "text-green-700" :
                      item.type === "warning" ? "text-amber-700" :
                      "text-blue-700"
                    }`}>
                      {item.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              ⚠️ 以上建議僅供參考，如有健康疑慮請諮詢專業醫師。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 無資料提示 */}
      {!profile?.height_cm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">尚未設定健康資料</p>
                <p className="text-sm text-amber-700">
                  請至 <Link href="/dashboard/settings" className="underline">設定頁面</Link> 填寫身高、出生年等資料，以獲得更準確的健康建議。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
