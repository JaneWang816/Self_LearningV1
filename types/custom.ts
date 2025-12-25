// types/custom.ts
// 自定義類型與便利類型別名

import type { Tables, TablesInsert, TablesUpdate } from "./database.types"

// ============================================
// 模組類型
// ============================================
export type ModuleType = 
  | 'journal' 
  | 'habits' 
  | 'tasks' 
  | 'schedule' 
  | 'health' 
  | 'finance' 
  | 'study'

// ============================================
// 便利類型別名 - Row (讀取)
// ============================================
export type Profile = Tables<'profiles'>
export type Task = Tables<'tasks'>
export type ScheduleSlot = Tables<'schedule_slots'>
export type Habit = Tables<'habits'>
export type HabitLog = Tables<'habit_logs'>
export type JournalLife = Tables<'journals_life'>
export type JournalLearning = Tables<'journals_learning'>
export type JournalReading = Tables<'journals_reading'>
export type JournalGratitude = Tables<'journals_gratitude'>
export type FinanceRecord = Tables<'finance_records'>
export type HealthExercise = Tables<'health_exercises'>
export type HealthMetric = Tables<'health_metrics'>
export type Deck = Tables<'decks'>
export type Flashcard = Tables<'flashcards'>
export type Subject = Tables<'subjects'>
export type Topic = Tables<'topics'>
export type Unit = Tables<'units'>
export type Question = Tables<'questions'>
export type QuestionType = Tables<'question_types'>
export type QuestionTopic = Tables<'question_topics'>

// ============================================
// 便利類型別名 - Insert (新增)
// ============================================
export type TaskInsert = TablesInsert<'tasks'>
export type HabitInsert = TablesInsert<'habits'>
export type HabitLogInsert = TablesInsert<'habit_logs'>
export type JournalLifeInsert = TablesInsert<'journals_life'>
export type JournalLearningInsert = TablesInsert<'journals_learning'>
export type JournalReadingInsert = TablesInsert<'journals_reading'>
export type JournalGratitudeInsert = TablesInsert<'journals_gratitude'>
export type FinanceRecordInsert = TablesInsert<'finance_records'>
export type HealthExerciseInsert = TablesInsert<'health_exercises'>
export type HealthMetricInsert = TablesInsert<'health_metrics'>
export type FlashcardInsert = TablesInsert<'flashcards'>
export type DeckInsert = TablesInsert<'decks'>

// ============================================
// 便利類型別名 - Update (更新)
// ============================================
export type TaskUpdate = TablesUpdate<'tasks'>
export type HabitUpdate = TablesUpdate<'habits'>
export type HabitLogUpdate = TablesUpdate<'habit_logs'>
export type JournalLifeUpdate = TablesUpdate<'journals_life'>
export type JournalLearningUpdate = TablesUpdate<'journals_learning'>
export type JournalReadingUpdate = TablesUpdate<'journals_reading'>
export type JournalGratitudeUpdate = TablesUpdate<'journals_gratitude'>
export type FinanceRecordUpdate = TablesUpdate<'finance_records'>
export type HealthExerciseUpdate = TablesUpdate<'health_exercises'>
export type HealthMetricUpdate = TablesUpdate<'health_metrics'>
export type FlashcardUpdate = TablesUpdate<'flashcards'>
export type DeckUpdate = TablesUpdate<'decks'>

// ============================================
// 擴展類型（含額外欄位）
// ============================================

// 習慣含今日打卡狀態
export type HabitWithTodayLog = Habit & {
  todayLog?: HabitLog | null
}

// 任務含例行任務欄位
export type TaskWithRecurrence = Task

// ============================================
// 任務四象限類型
// ============================================
export type TaskQuadrant = 
  | 'do_first'      // 重要且緊急
  | 'schedule'      // 重要不緊急
  | 'delegate'      // 緊急不重要
  | 'eliminate'     // 不重要不緊急

// 取得任務象限
export function getTaskQuadrant(task: Task): TaskQuadrant {
  const isImportant = task.is_important ?? false
  const isUrgent = task.is_urgent ?? false
  
  if (isImportant && isUrgent) return 'do_first'
  if (isImportant && !isUrgent) return 'schedule'
  if (!isImportant && isUrgent) return 'delegate'
  return 'eliminate'
}

// ============================================
// 重複類型
// ============================================
export type RecurrenceType = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'quarterly' 
  | 'semiannually' 
  | 'yearly' 
  | 'custom'

// ============================================
// 課表相關
// ============================================
export type SlotTime = {
  slot: number
  startTime: string
  endTime: string
}

export const SCHEDULE_SLOTS: SlotTime[] = [
  { slot: 1, startTime: '08:00', endTime: '08:50' },
  { slot: 2, startTime: '09:00', endTime: '09:50' },
  { slot: 3, startTime: '10:00', endTime: '10:50' },
  { slot: 4, startTime: '11:00', endTime: '11:50' },
  { slot: 5, startTime: '12:00', endTime: '12:50' },
  { slot: 6, startTime: '13:00', endTime: '13:50' },
  { slot: 7, startTime: '14:00', endTime: '14:50' },
  { slot: 8, startTime: '15:00', endTime: '15:50' },
  { slot: 9, startTime: '16:00', endTime: '16:50' },
  { slot: 10, startTime: '17:00', endTime: '17:50' },
]

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: '週一',
  2: '週二',
  3: '週三',
  4: '週四',
  5: '週五',
  6: '週六',
  7: '週日',
}

// ============================================
// 心情對照
// ============================================
export const MOOD_LABELS: Record<number, string> = {
  1: '😢 很差',
  2: '😕 不好',
  3: '😐 普通',
  4: '🙂 不錯',
  5: '😄 很棒',
}

// ============================================
// 健康數值類型對照
// ============================================
export const METRIC_TYPE_LABELS: Record<string, string> = {
  weight: '體重 (kg)',
  blood_pressure: '血壓 (mmHg)',
  sleep: '睡眠 (小時)',
  water: '飲水 (ml)',
}

// ============================================
// 收支分類建議
// ============================================
export const EXPENSE_CATEGORIES = [
  '飲食',
  '交通',
  '娛樂',
  '購物',
  '學習',
  '其他',
] as const

export const INCOME_CATEGORIES = [
  '零用錢',
  '獎學金',
  '打工',
  '禮金',
  '其他',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
export type IncomeCategory = typeof INCOME_CATEGORIES[number]

// ============================================
// 運動類型建議
// ============================================
export const EXERCISE_TYPES = [
  '跑步',
  '游泳',
  '籃球',
  '羽球',
  '健身',
  '瑜珈',
  '騎車',
  '走路',
  '其他',
] as const

export type ExerciseType = typeof EXERCISE_TYPES[number]
