// components/layout/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  FileQuestion,
  XCircle,
  Lightbulb,
  LayoutDashboard,
} from "lucide-react"

const navItems = [
  {
    title: "總覽",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "科目",
    href: "/dashboard/subjects",
    icon: BookOpen,
  },
  {
    title: "題庫",
    href: "/dashboard/practice",
    icon: FileQuestion,
  },
  {
    title: "錯題本",
    href: "/dashboard/mistakes",
    icon: XCircle,
  },
  {
    title: "記憶卡片",
    href: "/dashboard/flashcards",
    icon: Lightbulb,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <span className="ml-3 text-xl font-bold text-gray-800">自主學習</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-700" : "text-gray-400")} />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
