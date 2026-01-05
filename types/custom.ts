// types/custom.ts
// è‡ªå®šç¾©é¡žåž‹èˆ‡ä¾¿åˆ©é¡žåž‹åˆ¥å

import type { Tables, TablesInsert, TablesUpdate } from "./database.types"

// ============================================
// æ¨¡çµ„é¡žåž‹
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
// ä¾¿åˆ©é¡žåž‹åˆ¥å - Row (è®€å–)
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
// 筆記相關類型
// ============================================

// 筆記分類類型
export type NoteCategoryType = 
  | 'key_point'   // 🔴 重點
  | 'definition'  // 📘 定義
  | 'formula'     // 📐 公式
  | 'example'     // 📝 例題
  | 'tip'         // 💡 技巧
  | 'summary'     // 📋 總結
  | 'warning'     // ⚠️ 易錯
  | 'other'       // 📌 其他

// 筆記連結類型
export type NoteLinkType = 'question' | 'flashcard'

// 單元筆記（使用 Supabase 生成的類型，重新定義以確保類型安全）
export type UnitNote = {
  id: string
  unit_id: string
  user_id: string
  category: NoteCategoryType
  title: string | null
  content: string
  is_important: boolean
  order: number
  created_at: string
  updated_at: string
}

// 筆記關聯
export type NoteLink = {
  id: string
  note_id: string
  user_id: string
  link_type: NoteLinkType
  target_id: string
  created_at: string
}

// éŠè¦½æ—¥èªŒï¼ˆæ‰‹å‹•å®šç¾©ï¼Œå› ç‚º database.types å¯èƒ½å°šæœªæ›´æ–°ï¼‰
export type JournalTravel = {
  id: string
  user_id: string
  date: string
  title: string
  location: string
  duration_minutes: number | null
  content: string | null
  mood: number | null
  weather: string | null
  companions: string | null
  rating: number | null
  photos: string[] | null
  created_at: string
  updated_at: string
}

// æ¯æ—¥è¡Œç¨‹ï¼ˆæ‰‹å‹•å®šç¾©ï¼‰
export type DailyPlan = {
  id: string
  user_id: string
  date: string
  title: string
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  location: string | null
  description: string | null
  color: string
  recurrence_type: string
  recurrence_end_date: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

// ============================================
// ä¾¿åˆ©é¡žåž‹åˆ¥å - Insert (æ–°å¢ž)
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

// éŠè¦½æ—¥èªŒ Insert
export type JournalTravelInsert = Omit<JournalTravel, 'id' | 'created_at' | 'updated_at'>

// æ¯æ—¥è¡Œç¨‹ Insert
export type DailyPlanInsert = Omit<DailyPlan, 'id' | 'created_at' | 'updated_at'>

// ============================================
// ä¾¿åˆ©é¡žåž‹åˆ¥å - Update (æ›´æ–°)
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

// éŠè¦½æ—¥èªŒ Update
export type JournalTravelUpdate = Partial<Omit<JournalTravel, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// æ¯æ—¥è¡Œç¨‹ Update
export type DailyPlanUpdate = Partial<Omit<DailyPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// 單元筆記 Insert/Update
export type UnitNoteInsert = Omit<UnitNote, 'id' | 'created_at' | 'updated_at'>
export type UnitNoteUpdate = Partial<Omit<UnitNote, 'id' | 'user_id' | 'unit_id' | 'created_at' | 'updated_at'>>

// 筆記關聯 Insert
export type NoteLinkInsert = Omit<NoteLink, 'id' | 'created_at'>

// ============================================
// æ“´å±•é¡žåž‹ï¼ˆå«é¡å¤–æ¬„ä½ï¼‰
// ============================================

// ç¿’æ…£å«ä»Šæ—¥æ‰“å¡ç‹€æ…‹
export type HabitWithTodayLog = Habit & {
  todayLog?: HabitLog | null
}

// ä»»å‹™å«ä¾‹è¡Œä»»å‹™æ¬„ä½
export type TaskWithRecurrence = Task

// å¥åº·æ•¸å€¼å«è„ˆææ¬„ä½
export type HealthMetricExtended = HealthMetric & {
  value_tertiary?: number | null
}

// ============================================
// ä»»å‹™å››è±¡é™é¡žåž‹
// ============================================
export type TaskQuadrant = 
  | 'do_first'      // é‡è¦ä¸”ç·Šæ€¥
  | 'schedule'      // é‡è¦ä¸ç·Šæ€¥
  | 'delegate'      // ç·Šæ€¥ä¸é‡è¦
  | 'eliminate'     // ä¸é‡è¦ä¸ç·Šæ€¥

// å–å¾—ä»»å‹™è±¡é™
export function getTaskQuadrant(task: Task): TaskQuadrant {
  const isImportant = task.is_important ?? false
  const isUrgent = task.is_urgent ?? false
  
  if (isImportant && isUrgent) return 'do_first'
  if (isImportant && !isUrgent) return 'schedule'
  if (!isImportant && isUrgent) return 'delegate'
  return 'eliminate'
}

// ============================================
// é‡è¤‡é¡žåž‹
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
// èª²è¡¨ç›¸é—œ
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
  1: 'é€±ä¸€',
  2: 'é€±äºŒ',
  3: 'é€±ä¸‰',
  4: 'é€±å››',
  5: 'é€±äº”',
  6: 'é€±å…­',
  7: 'é€±æ—¥',
}

// ============================================
// å¿ƒæƒ…å°ç…§
// ============================================
export const MOOD_LABELS: Record<number, string> = {
  1: 'ðŸ˜¢ å¾ˆå·®',
  2: 'ðŸ˜• ä¸å¥½',
  3: 'ðŸ˜ æ™®é€š',
  4: 'ðŸ™‚ ä¸éŒ¯',
  5: 'ðŸ˜„ å¾ˆæ£’',
}

// ============================================
// å¥åº·æ•¸å€¼é¡žåž‹å°ç…§
// ============================================
export const METRIC_TYPE_LABELS: Record<string, string> = {
  weight: 'é«”é‡ (kg)',
  blood_pressure: 'è¡€å£“',
  sleep: 'ç¡çœ  (å°æ™‚)',
  water: 'é£²æ°´ (ml)',
  steps: 'æ­¥æ•¸',
}

// ============================================
// æ”¶æ”¯åˆ†é¡žå»ºè­°
// ============================================
export const EXPENSE_CATEGORIES = [
  'é£²é£Ÿ',
  'äº¤é€š',
  'å¨›æ¨‚',
  'è³¼ç‰©',
  'å­¸ç¿’',
  'å…¶ä»–',
] as const

export const INCOME_CATEGORIES = [
  'é›¶ç”¨éŒ¢',
  'çŽé‡‘',
  'æ‰“å·¥',
  'ç¦®é‡‘',
  'å…¶ä»–',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
export type IncomeCategory = typeof INCOME_CATEGORIES[number]

// ============================================
// é‹å‹•é¡žåž‹å»ºè­°
// ============================================
export const EXERCISE_TYPES = [
  'è·‘æ­¥',
  'æ¸¸æ³³',
  'ç±ƒçƒ',
  'ç¾½çƒ',
  'æ¡Œçƒ',
  'å¥èº«',
  'ç‘œçˆ',
  'é¨Žè»Š',
  'å¥è¡Œ',
  'å…¶ä»–',
] as const

export type ExerciseType = typeof EXERCISE_TYPES[number]

// ============================================
// å¤©æ°£é¸é …ï¼ˆéŠè¦½æ—¥èªŒç”¨ï¼‰
// ============================================
export const WEATHER_OPTIONS = [
  'â˜€ï¸ æ™´å¤©',
  'â›… å¤šé›²',
  'â˜ï¸ é™°å¤©',
  'ðŸŒ§ï¸ é›¨å¤©',
  'â›ˆï¸ é›·é›¨',
  'ðŸŒ¨ï¸ é›ªå¤©',
  'ðŸŒ«ï¸ éœ§',
] as const

export type WeatherOption = typeof WEATHER_OPTIONS[number]

// ============================================
// åŒè¡Œè€…é¸é …ï¼ˆéŠè¦½æ—¥èªŒç”¨ï¼‰
// ============================================
export const COMPANION_OPTIONS = [
  'ðŸ‘¤ ç¨è‡ª',
  'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ å®¶äºº',
  'ðŸ‘« æœ‹å‹',
  'ðŸ’‘ æƒ…ä¾¶',
  'ðŸ‘¥ åŒå­¸',
  'ðŸ¢ åŒäº‹',
  'ðŸŽ’ åœ˜é«”æ—…éŠ',
] as const

export type CompanionOption = typeof COMPANION_OPTIONS[number]

// ============================================
// 筆記分類常數
// ============================================
export const NOTE_CATEGORIES = [
  { value: 'key_point', label: '🔴 重點', color: 'bg-red-100 border-red-300' },
  { value: 'definition', label: '📘 定義', color: 'bg-blue-100 border-blue-300' },
  { value: 'formula', label: '📐 公式', color: 'bg-purple-100 border-purple-300' },
  { value: 'example', label: '📝 例題', color: 'bg-green-100 border-green-300' },
  { value: 'tip', label: '💡 技巧', color: 'bg-yellow-100 border-yellow-300' },
  { value: 'summary', label: '📋 總結', color: 'bg-gray-100 border-gray-300' },
  { value: 'warning', label: '⚠️ 易錯', color: 'bg-orange-100 border-orange-300' },
  { value: 'other', label: '📌 其他', color: 'bg-slate-100 border-slate-300' },
] as const

export const NOTE_CATEGORY_MAP: Record<NoteCategoryType, { label: string; color: string }> = {
  key_point: { label: '🔴 重點', color: 'bg-red-100 border-red-300' },
  definition: { label: '📘 定義', color: 'bg-blue-100 border-blue-300' },
  formula: { label: '📐 公式', color: 'bg-purple-100 border-purple-300' },
  example: { label: '📝 例題', color: 'bg-green-100 border-green-300' },
  tip: { label: '💡 技巧', color: 'bg-yellow-100 border-yellow-300' },
  summary: { label: '📋 總結', color: 'bg-gray-100 border-gray-300' },
  warning: { label: '⚠️ 易錯', color: 'bg-orange-100 border-orange-300' },
  other: { label: '📌 其他', color: 'bg-slate-100 border-slate-300' },
}
