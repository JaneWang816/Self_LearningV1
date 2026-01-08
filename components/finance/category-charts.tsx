// components/finance/category-charts.tsx
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Target, PieChart as PieChartIcon } from "lucide-react"

// 顏色常量
const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", 
  "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
]

// 進度條顏色
const getProgressColor = (percent: number) => {
  if (percent >= 100) return "#ef4444" // 紅色
  if (percent >= 80) return "#f59e0b"  // 橙色
  return "#22c55e" // 綠色
}

interface CategoryStat {
  id: string
  name: string
  icon: string
  amount: number
  color?: string
}

interface Budget {
  id: string
  category_id: string | null
  amount: number
}

interface CategoryChartsProps {
  categoryStats: CategoryStat[]
  totalExpense: number
  budgets: Budget[]
  monthLabel: string
}

export function CategoryCharts({
  categoryStats,
  totalExpense,
  budgets,
  monthLabel,
}: CategoryChartsProps) {
  // 建立預算對照表
  const budgetMap = useMemo(() => {
    const map = new Map<string, number>()
    budgets.forEach((b) => {
      if (b.category_id) {
        map.set(b.category_id, Number(b.amount))
      }
    })
    return map
  }, [budgets])

  // 準備預算使用率資料（橫條圖）
  const budgetUsageData = useMemo(() => {
    return categoryStats
      .filter((stat) => budgetMap.has(stat.id))
      .map((stat) => {
        const budget = budgetMap.get(stat.id) || 0
        const usagePercent = budget > 0 ? (stat.amount / budget) * 100 : 0
        return {
          name: `${stat.icon} ${stat.name}`,
          spent: stat.amount,
          budget: budget,
          usagePercent: Math.round(usagePercent * 10) / 10,
          fill: getProgressColor(usagePercent),
        }
      })
      .sort((a, b) => b.usagePercent - a.usagePercent)
  }, [categoryStats, budgetMap])

  // 準備支出佔比資料（圓餅圖）
  const expenseRatioData = useMemo(() => {
    return categoryStats.map((stat, index) => ({
      name: stat.name,
      value: stat.amount,
      icon: stat.icon,
      percent: totalExpense > 0 ? (stat.amount / totalExpense) * 100 : 0,
      fill: stat.color || COLORS[index % COLORS.length],
    }))
  }, [categoryStats, totalExpense])

  // 如果沒有任何資料
  if (categoryStats.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 左邊：預算使用率橫條圖 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-600" />
            預算使用率
          </CardTitle>
          <CardDescription className="text-xs">
            各分類支出佔預算比例
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetUsageData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={budgetUsageData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    domain={[0, (dataMax: number) => Math.max(dataMax, 100)]}
                    tickFormatter={(v) => `${v}%`}
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numValue = Number(value) || 0
                      const nameStr = String(name || "")
                      if (nameStr === "usagePercent") {
                        return [`${numValue}%`, "使用率"]
                      }
                      return [`$${numValue.toLocaleString()}`, nameStr === "spent" ? "已支出" : "預算"]
                    }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar 
                    dataKey="usagePercent" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {budgetUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* 圖例說明 */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>&lt;80%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span>80-100%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>&gt;100%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 text-sm">
              <Target className="w-8 h-8 mb-2 opacity-50" />
              <p>尚未設定分類預算</p>
              <p className="text-xs mt-1">前往「預算管理」設定</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 右邊：支出佔比圓餅圖 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-600" />
            支出結構
          </CardTitle>
          <CardDescription className="text-xs">
            {monthLabel} 各分類支出佔比
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenseRatioData.length > 0 ? (
            <div className="flex flex-col">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseRatioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseRatioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${(Number(value) || 0).toLocaleString()}`, "支出"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* 分類列表 */}
              <div className="space-y-1.5 mt-2">
                {expenseRatioData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-gray-700">{item.icon} {item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-800">
                        ${item.value.toLocaleString()}
                      </span>
                      <span className="text-gray-400 ml-1.5 text-xs">
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {expenseRatioData.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    還有 {expenseRatioData.length - 5} 個分類...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 text-sm">
              <PieChartIcon className="w-8 h-8 mb-2 opacity-50" />
              <p>本月無支出記錄</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
