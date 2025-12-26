// app/(dashboard)/dashboard/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  User,
  Layers,
  Shield,
  LogOut,
  Save,
  BookOpen,
  CheckSquare,
  Calendar,
  Dumbbell,
  Wallet,
  GraduationCap,
  ListTodo,
  Tag,
} from "lucide-react"
import type { Profile, ModuleType } from "@/types/custom"

// 模組配置
const MODULE_CONFIG: {
  key: ModuleType
  title: string
  description: string
  icon: React.ElementType
  color: string
}[] = [
  {
    key: "journal",
    title: "日誌",
    description: "生活、學習、閱讀、感恩日誌",
    icon: BookOpen,
    color: "text-blue-600",
  },
  {
    key: "habits",
    title: "習慣追蹤",
    description: "每日習慣打卡",
    icon: CheckSquare,
    color: "text-green-600",
  },
  {
    key: "tasks",
    title: "任務管理",
    description: "四象限任務規劃",
    icon: ListTodo,
    color: "text-amber-600",
  },
  {
    key: "schedule",
    title: "課表",
    description: "每週課程安排",
    icon: Calendar,
    color: "text-purple-600",
  },
  {
    key: "health",
    title: "健康記錄",
    description: "運動與健康數據追蹤",
    icon: Dumbbell,
    color: "text-pink-600",
  },
  {
    key: "finance",
    title: "收支記錄",
    description: "收入與支出管理",
    icon: Wallet,
    color: "text-orange-600",
  },
  {
    key: "study",
    title: "學習系統",
    description: "題庫練習、錯題本、記憶卡片",
    icon: GraduationCap,
    color: "text-indigo-600",
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // 個人資料
  const [nickname, setNickname] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // 模組設定
  const [enabledModules, setEnabledModules] = useState<ModuleType[]>([])
  const [savingModules, setSavingModules] = useState(false)

  // 密碼修改
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // 登出確認
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // 期初餘額
  const [initialBalance, setInitialBalance] = useState<number>(0)
  const [savingBalance, setSavingBalance] = useState(false)

  // 載入資料
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setNickname(profileData.nickname || "")
        setAvatarUrl(profileData.avatar_url || "")
        setEnabledModules((profileData.enabled_modules as ModuleType[]) || ["journal", "habits", "tasks", "schedule"])
        setInitialBalance(profileData.initial_balance ? Number(profileData.initial_balance) : 0)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  // 儲存個人資料
  const handleSaveProfile = async () => {
    if (!profile) return

    setSavingProfile(true)

    await supabase
      .from("profiles")
      .update({
        nickname: nickname.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", profile.id)

    setSavingProfile(false)
  }

  // 儲存期初餘額
  const handleSaveBalance = async () => {
    if (!profile) return

    setSavingBalance(true)

    await supabase
      .from("profiles")
      .update({
        initial_balance: initialBalance,
      })
      .eq("id", profile.id)

    setSavingBalance(false)
  }

  // 切換模組
  const toggleModule = (module: ModuleType) => {
    setEnabledModules((prev) => {
      if (prev.includes(module)) {
        return prev.filter((m) => m !== module)
      } else {
        return [...prev, module]
      }
    })
  }

  // 儲存模組設定
  const handleSaveModules = async () => {
    if (!profile) return

    setSavingModules(true)

    await supabase
      .from("profiles")
      .update({
        enabled_modules: enabledModules,
      })
      .eq("id", profile.id)

    setSavingModules(false)

    // 重新載入頁面以更新側邊欄
    window.location.reload()
  }

  // 修改密碼
  const handleChangePassword = async () => {
    setPasswordError("")

    if (newPassword.length < 6) {
      setPasswordError("新密碼至少需要 6 個字元")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("兩次輸入的密碼不一致")
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setPasswordError(error.message)
      setSavingPassword(false)
      return
    }

    setSavingPassword(false)
    setPasswordDialogOpen(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")

    alert("密碼已更新")
  }

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>
        <p className="text-gray-600 mt-1">管理你的帳號與偏好設定</p>
      </div>

      {/* 個人資料 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            個人資料
          </CardTitle>
          <CardDescription>設定你的顯示名稱與頭像</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>暱稱</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入你的暱稱"
            />
          </div>
          <div className="space-y-2">
            <Label>頭像網址</Label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            {avatarUrl && (
              <div className="mt-2">
                <img
                  src={avatarUrl}
                  alt="頭像預覽"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? "儲存中..." : "儲存"}
          </Button>
        </CardContent>
      </Card>

      {/* 模組管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            模組管理
          </CardTitle>
          <CardDescription>選擇要啟用的功能模組</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MODULE_CONFIG.map((module) => {
            const Icon = module.icon
            const isEnabled = enabledModules.includes(module.key)

            return (
              <div
                key={module.key}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${module.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{module.title}</p>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleModule(module.key)}
                />
              </div>
            )
          })}

          <Button
            onClick={handleSaveModules}
            disabled={savingModules}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingModules ? "儲存中..." : "儲存模組設定"}
          </Button>
          <p className="text-xs text-gray-500">
            ⚠️ 儲存後頁面會重新載入以更新側邊欄
          </p>
        </CardContent>
      </Card>

      {/* 收支設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            收支設定
          </CardTitle>
          <CardDescription>管理期初餘額與分類</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 期初餘額 */}
          <div className="space-y-2">
            <Label>期初餘額</Label>
            <p className="text-xs text-gray-500">設定開始記帳時的初始金額，用於計算累計結餘</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="max-w-[200px]"
              />
              <Button
                onClick={handleSaveBalance}
                disabled={savingBalance}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingBalance ? "儲存中..." : "儲存"}
              </Button>
            </div>
          </div>

          {/* 分類管理 */}
          <div className="pt-2 border-t">
            <Label className="mb-2 block">收支分類</Label>
            <Link href="/dashboard/finance/categories">
              <Button variant="outline">
                <Tag className="w-4 h-4 mr-2" />
                管理分類
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 帳號安全 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            帳號安全
          </CardTitle>
          <CardDescription>管理你的帳號安全設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-gray-800">修改密碼</p>
              <p className="text-sm text-gray-500">定期更換密碼以保護帳號安全</p>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              修改
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
            <div>
              <p className="font-medium text-red-800">登出</p>
              <p className="text-sm text-red-600">登出目前的帳號</p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 修改密碼對話框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密碼</DialogTitle>
            <DialogDescription>請輸入新密碼</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>新密碼</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 個字元"
              />
            </div>
            <div className="space-y-2">
              <Label>確認新密碼</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入新密碼"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingPassword ? "更新中..." : "更新密碼"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 登出確認 */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要登出嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              登出後需要重新登入才能使用系統。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              確定登出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
