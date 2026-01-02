// app/(dashboard)/dashboard/pomodoro/page.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { updateDailyStudySummary } from "@/lib/study-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Flame,
  Settings,
  Volume2,
  VolumeX,
  CheckCircle,
  Clock,
} from "lucide-react"

// 預設時間設定（分鐘）
const PRESETS = {
  focus: [15, 25, 30, 45, 50],
  break: [5, 10, 15],
  longBreak: [15, 20, 30],
}

// 番茄鐘模式
type TimerMode = "focus" | "break" | "longBreak"

interface TodayStats {
  completedPomodoros: number
  totalMinutes: number
}

export default function PomodoroPage() {
  // 計時器狀態
  const [mode, setMode] = useState<TimerMode>("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 秒
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  
  // 設定
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [longBreakInterval, setLongBreakInterval] = useState(4) // 每幾個番茄後長休息
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  
  // 關聯科目
  const [subjects, setSubjects] = useState<{ id: string; title: string }[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  
  // 今日統計
  const [todayStats, setTodayStats] = useState<TodayStats>({
    completedPomodoros: 0,
    totalMinutes: 0,
  })
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // 載入科目列表
  useEffect(() => {
    const loadSubjects = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from("subjects")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title")
      
      if (data) {
        setSubjects(data)
      }
    }
    
    loadSubjects()
    loadTodayStats()
    loadSettings()
  }, [])
  
  // 載入今日統計
  const loadTodayStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const today = new Date().toISOString().split("T")[0]
    
    const { data } = await supabase
      .from("pomodoro_sessions")
      .select("duration")
      .eq("user_id", user.id)
      .gte("created_at", today)
      .eq("completed", true)
    
    if (data) {
      setTodayStats({
        completedPomodoros: data.length,
        totalMinutes: data.reduce((sum, s) => sum + (s.duration || 0), 0),
      })
      setCompletedPomodoros(data.length)
    }
  }
  
  // 載入設定
  const loadSettings = () => {
    const saved = localStorage.getItem("pomodoroSettings")
    if (saved) {
      const settings = JSON.parse(saved)
      setFocusDuration(settings.focusDuration || 25)
      setBreakDuration(settings.breakDuration || 5)
      setLongBreakDuration(settings.longBreakDuration || 15)
      setLongBreakInterval(settings.longBreakInterval || 4)
      setSoundEnabled(settings.soundEnabled !== false)
      setTimeLeft((settings.focusDuration || 25) * 60)
    }
  }
  
  // 儲存設定
  const saveSettings = () => {
    const settings = {
      focusDuration,
      breakDuration,
      longBreakDuration,
      longBreakInterval,
      soundEnabled,
    }
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings))
  }
  
  // 播放音效
  const playSound = useCallback((type: "complete" | "tick") => {
    if (!soundEnabled) return
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      if (type === "complete") {
        // 完成音效：較長的提示音
        oscillator.frequency.setValueAtTime(800, ctx.currentTime)
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
      } else {
        // 滴答聲
        oscillator.frequency.setValueAtTime(600, ctx.currentTime)
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.05)
      }
    } catch (e) {
      console.log("Audio not supported")
    }
  }, [soundEnabled])
  
  // 計時器完成
  const handleTimerComplete = useCallback(async () => {
    playSound("complete")
    setIsRunning(false)
    
    if (mode === "focus") {
      // 專注時間完成，記錄統計
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 記錄到 pomodoro_sessions
        await supabase.from("pomodoro_sessions").insert({
          user_id: user.id,
          duration: focusDuration,
          subject_id: selectedSubject || null,
          completed: true,
        })
        
        // 更新每日統計
        await updateDailyStudySummary({
          type: "study_time",
          minutes: focusDuration,
        })
      }
      
      const newCount = completedPomodoros + 1
      setCompletedPomodoros(newCount)
      setTodayStats(prev => ({
        completedPomodoros: prev.completedPomodoros + 1,
        totalMinutes: prev.totalMinutes + focusDuration,
      }))
      
      // 決定休息時間
      if (newCount % longBreakInterval === 0) {
        setMode("longBreak")
        setTimeLeft(longBreakDuration * 60)
      } else {
        setMode("break")
        setTimeLeft(breakDuration * 60)
      }
    } else {
      // 休息時間完成，切回專注
      setMode("focus")
      setTimeLeft(focusDuration * 60)
    }
  }, [mode, focusDuration, breakDuration, longBreakDuration, longBreakInterval, completedPomodoros, selectedSubject, playSound])
  
  // 計時器邏輯
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, handleTimerComplete])
  
  // 開始/暫停
  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }
  
  // 重置
  const resetTimer = () => {
    setIsRunning(false)
    if (mode === "focus") {
      setTimeLeft(focusDuration * 60)
    } else if (mode === "break") {
      setTimeLeft(breakDuration * 60)
    } else {
      setTimeLeft(longBreakDuration * 60)
    }
  }
  
  // 切換模式
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    if (newMode === "focus") {
      setTimeLeft(focusDuration * 60)
    } else if (newMode === "break") {
      setTimeLeft(breakDuration * 60)
    } else {
      setTimeLeft(longBreakDuration * 60)
    }
  }
  
  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  // 計算進度百分比
  const getProgress = () => {
    let total = focusDuration * 60
    if (mode === "break") total = breakDuration * 60
    if (mode === "longBreak") total = longBreakDuration * 60
    return ((total - timeLeft) / total) * 100
  }
  
  // 模式顏色
  const getModeColor = () => {
    if (mode === "focus") return "text-red-500"
    if (mode === "break") return "text-green-500"
    return "text-blue-500"
  }
  
  const getModeBgColor = () => {
    if (mode === "focus") return "bg-red-500"
    if (mode === "break") return "bg-green-500"
    return "bg-blue-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🍅 番茄鐘</h1>
          <p className="text-gray-500 mt-1">專注學習，提升效率</p>
        </div>
        
        {/* 模式切換 */}
        <div className="flex justify-center gap-2">
          <Button
            variant={mode === "focus" ? "default" : "outline"}
            onClick={() => switchMode("focus")}
            className={mode === "focus" ? "bg-red-500 hover:bg-red-600" : ""}
          >
            <Brain className="w-4 h-4 mr-2" />
            專注
          </Button>
          <Button
            variant={mode === "break" ? "default" : "outline"}
            onClick={() => switchMode("break")}
            className={mode === "break" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            <Coffee className="w-4 h-4 mr-2" />
            短休息
          </Button>
          <Button
            variant={mode === "longBreak" ? "default" : "outline"}
            onClick={() => switchMode("longBreak")}
            className={mode === "longBreak" ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            <Coffee className="w-4 h-4 mr-2" />
            長休息
          </Button>
        </div>
        
        {/* 計時器主體 */}
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            {/* 進度條 */}
            <div className="h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${getModeBgColor()}`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            
            {/* 時間顯示 */}
            <div className="text-center mb-8">
              <div className={`text-7xl md:text-8xl font-mono font-bold ${getModeColor()}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-gray-500 mt-2 text-lg">
                {mode === "focus" && "專注時間"}
                {mode === "break" && "短休息"}
                {mode === "longBreak" && "長休息"}
              </div>
            </div>
            
            {/* 控制按鈕 */}
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
                className="w-14 h-14 rounded-full"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              
              <Button
                size="lg"
                onClick={toggleTimer}
                className={`w-20 h-20 rounded-full text-white ${getModeBgColor()} hover:opacity-90`}
              >
                {isRunning ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-14 h-14 rounded-full"
              >
                {soundEnabled ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 科目選擇 */}
        {subjects.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-600 whitespace-nowrap">正在學習：</span>
                <Select 
                  value={selectedSubject || "_none"} 
                  onValueChange={(val) => setSelectedSubject(val === "_none" ? "" : val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="選擇科目（可選）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">不指定</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 今日統計 */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                <Flame className="w-5 h-5" />
                <span className="font-medium">完成番茄</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {todayStats.completedPomodoros}
              </div>
              <div className="text-sm text-gray-500">個</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-500 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">專注時間</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {todayStats.totalMinutes}
              </div>
              <div className="text-sm text-gray-500">分鐘</div>
            </CardContent>
          </Card>
        </div>
        
        {/* 設定 */}
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Settings className="w-5 h-5" />
                <span className="font-medium">時間設定</span>
              </div>
              <span className="text-gray-400">{showSettings ? "收起" : "展開"}</span>
            </button>
            
            {showSettings && (
              <div className="mt-4 space-y-4 pt-4 border-t">
                {/* 專注時間 */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    專注時間（分鐘）
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESETS.focus.map((mins) => (
                      <Button
                        key={mins}
                        size="sm"
                        variant={focusDuration === mins ? "default" : "outline"}
                        onClick={() => {
                          setFocusDuration(mins)
                          if (mode === "focus" && !isRunning) {
                            setTimeLeft(mins * 60)
                          }
                        }}
                        className={focusDuration === mins ? "bg-red-500" : ""}
                      >
                        {mins}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* 短休息時間 */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    短休息時間（分鐘）
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESETS.break.map((mins) => (
                      <Button
                        key={mins}
                        size="sm"
                        variant={breakDuration === mins ? "default" : "outline"}
                        onClick={() => {
                          setBreakDuration(mins)
                          if (mode === "break" && !isRunning) {
                            setTimeLeft(mins * 60)
                          }
                        }}
                        className={breakDuration === mins ? "bg-green-500" : ""}
                      >
                        {mins}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* 長休息時間 */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    長休息時間（分鐘）
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESETS.longBreak.map((mins) => (
                      <Button
                        key={mins}
                        size="sm"
                        variant={longBreakDuration === mins ? "default" : "outline"}
                        onClick={() => {
                          setLongBreakDuration(mins)
                          if (mode === "longBreak" && !isRunning) {
                            setTimeLeft(mins * 60)
                          }
                        }}
                        className={longBreakDuration === mins ? "bg-blue-500" : ""}
                      >
                        {mins}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* 長休息間隔 */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    每幾個番茄後長休息
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((num) => (
                      <Button
                        key={num}
                        size="sm"
                        variant={longBreakInterval === num ? "default" : "outline"}
                        onClick={() => setLongBreakInterval(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* 儲存按鈕 */}
                <Button
                  onClick={saveSettings}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  儲存設定
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 使用說明 */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-amber-800 mb-2">💡 番茄工作法小提示</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 一個番茄時間內專注做一件事，避免分心</li>
              <li>• 休息時間離開座位，活動一下身體</li>
              <li>• 每完成 {longBreakInterval} 個番茄，給自己一個長休息</li>
              <li>• 完成的專注時間會自動記錄到學習統計</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
