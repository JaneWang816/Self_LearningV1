// components/layout/bottom-nav.tsx
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
    title: "錯題",
    href: "/dashboard/mistakes",
    icon: XCircle,
  },
  {
    title: "卡片",
    href: "/dashboard/flashcards",
    icon: Lightbulb,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="mt-1 text-xs">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
