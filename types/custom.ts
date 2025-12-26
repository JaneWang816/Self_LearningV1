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
export type FinanceCategory = Tables<'finance_categories'>
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
export type FinanceCategoryInsert = TablesInsert<'finance_categories'>
export type HealthExerciseInsert = TablesInsert<'health_exercises'>
export type HealthMetricInsert = TablesInsert<'health_metrics'>
export type DeckInsert = TablesInsert<'decks'>
export type FlashcardInsert = TablesInsert<'flashcards'>
export type SubjectInsert = TablesInsert<'subjects'>
export type TopicInsert = TablesInsert<'topics'>
export type UnitInsert = TablesInsert<'units'>
export type QuestionInsert = TablesInsert<'questions'>
export type QuestionTopicInsert = TablesInsert<'question_topics'>

// ============================================
// 便利類型別名 - Update (更新)
// ============================================
export type TaskUpdate = TablesUpdate<'tasks'>
export type HabitUpdate = TablesUpdate<'habits'>
export type JournalLifeUpdate = TablesUpdate<'journals_life'>
export type JournalLearningUpdate = TablesUpdate<'journals_learning'>
export type JournalReadingUpdate = TablesUpdate<'journals_reading'>
export type JournalGratitudeUpdate = TablesUpdate<'journals_gratitude'>
export type FinanceRecordUpdate = TablesUpdate<'finance_records'>
export type FinanceCategoryUpdate = TablesUpdate<'finance_categories'>
export type HealthExerciseUpdate = TablesUpdate<'health_exercises'>
export type HealthMetricUpdate = TablesUpdate<'health_metrics'>
export type DeckUpdate = TablesUpdate<'decks'>
export type FlashcardUpdate = TablesUpdate<'flashcards'>
export type SubjectUpdate = TablesUpdate<'subjects'>
export type TopicUpdate = TablesUpdate<'topics'>
export type UnitUpdate = TablesUpdate<'units'>
export type QuestionUpdate = TablesUpdate<'questions'>

// ============================================
// 任務類型（含週期性資訊）
// ============================================
export type TaskWithRecurrence = Task

// ============================================
// 複合/擴展類型
// ============================================

// 帶有科目名稱的學習日誌
export interface JournalLearningWithSubject extends JournalLearning {
  subjects?: {
    name: string
  } | null
}

// 帶有打卡記錄的習慣
export interface HabitWithLogs extends Habit {
  habit_logs?: HabitLog[]
}

// 帶有分類資訊的收支記錄
export interface FinanceRecordWithCategory extends FinanceRecord {
  finance_categories?: FinanceCategory | null
}

// 帶有主題的問題
export interface QuestionWithTopics extends Question {
  question_topics?: (QuestionTopic & {
    topics?: Topic | null
  })[]
}

// ============================================
// 學科相關類型
// ============================================
export interface SubjectWithStats extends Subject {
  topicCount?: number
  unitCount?: number
  questionCount?: number
}

export interface TopicWithUnits extends Topic {
  units?: Unit[]
  _count?: {
    units: number
    questions: number
  }
}

// ============================================
// SM-2 間隔重複相關類型
// ============================================
export interface SM2Result {
  repetitions: number
  easeFactor: number
  interval: number
  nextReviewDate: Date
}

export type SM2Grade = 0 | 1 | 2 | 3 | 4 | 5

// ============================================
// 常數定義
// ============================================

// 星期對照
export const DAY_NAMES: Record<number, string> = {
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
