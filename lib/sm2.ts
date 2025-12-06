// lib/sm2.ts
// SM-2 間隔重複演算法實作

export interface SM2Result {
  interval: number        // 下次複習間隔（天）
  easeFactor: number      // 難易度因子
  repetitionCount: number // 重複次數
  nextReviewAt: Date      // 下次複習時間
}

export interface SM2Input {
  quality: number          // 評分 0-4
  currentInterval: number  // 當前間隔
  currentEaseFactor: number // 當前難易度因子
  currentRepetitionCount: number // 當前重複次數
}

/**
 * SM-2 演算法
 * 
 * 評分說明：
 * 0 - 全忘：完全不記得，重新開始
 * 1 - 模糊：有印象但答錯
 * 2 - 要想：想了一下才記得
 * 3 - 順答：順利答出
 * 4 - 秒答：非常熟練
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, currentInterval, currentEaseFactor, currentRepetitionCount } = input

  let interval: number
  let easeFactor: number
  let repetitionCount: number

  // 評分 < 2 視為失敗，重新開始
  if (quality < 2) {
    repetitionCount = 0
    interval = 1 // 明天再複習
    easeFactor = Math.max(1.3, currentEaseFactor - 0.2)
  } else {
    // 評分 >= 2 視為成功
    repetitionCount = currentRepetitionCount + 1

    // 計算新間隔
    if (repetitionCount === 1) {
      interval = 1
    } else if (repetitionCount === 2) {
      interval = 3
    } else {
      interval = Math.round(currentInterval * currentEaseFactor)
    }

    // 根據評分調整間隔
    if (quality === 2) {
      interval = Math.max(1, Math.round(interval * 0.8)) // 要想：間隔稍減
    } else if (quality === 4) {
      interval = Math.round(interval * 1.3) // 秒答：間隔加長
    }

    // 更新難易度因子
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    easeFactor = Math.max(1.3, easeFactor) // 最小值 1.3
  }

  // 計算下次複習時間
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)
  nextReviewAt.setHours(0, 0, 0, 0) // 設為當天開始

  return {
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100, // 保留兩位小數
    repetitionCount,
    nextReviewAt,
  }
}

/**
 * 評分按鈕配置
 */
export const qualityButtons = [
  { value: 0, label: "全忘", color: "bg-red-500 hover:bg-red-600" },
  { value: 1, label: "模糊", color: "bg-orange-500 hover:bg-orange-600" },
  { value: 2, label: "要想", color: "bg-amber-500 hover:bg-amber-600" },
  { value: 3, label: "順答", color: "bg-green-500 hover:bg-green-600" },
  { value: 4, label: "秒答", color: "bg-emerald-500 hover:bg-emerald-600" },
]

/**
 * 計算預計下次複習時間的顯示文字
 */
export function getNextReviewText(days: number): string {
  if (days === 0) return "今天"
  if (days === 1) return "明天"
  if (days < 7) return `${days} 天後`
  if (days < 30) return `${Math.round(days / 7)} 週後`
  if (days < 365) return `${Math.round(days / 30)} 個月後`
  return `${Math.round(days / 365)} 年後`
}
