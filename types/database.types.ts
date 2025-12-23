// types/database.types.ts
// 對應 schema_v3.sql 的 TypeScript 類型定義

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
// Database 完整類型定義
// ============================================
export interface Database {
  public: {
    Tables: {
      // ==========================================
      // 用戶資料
      // ==========================================
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          enabled_modules: ModuleType[]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          enabled_modules?: ModuleType[]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          enabled_modules?: ModuleType[]
          created_at?: string | null
          updated_at?: string | null
        }
      }

      // ==========================================
      // 日誌模組
      // ==========================================
      journals_life: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          mood: number | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          mood?: number | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          mood?: number | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      journals_learning: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          title: string | null
          content: string
          duration_minutes: number | null
          difficulty: number | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          title?: string | null
          content: string
          duration_minutes?: number | null
          difficulty?: number | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          title?: string | null
          content?: string
          duration_minutes?: number | null
          difficulty?: number | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      journals_reading: {
        Row: {
          id: string
          user_id: string
          book_title: string
          author: string | null
          content: string | null
          pages_read: number | null
          current_page: number | null
          total_pages: number | null
          rating: number | null
          is_finished: boolean
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          book_title: string
          author?: string | null
          content?: string | null
          pages_read?: number | null
          current_page?: number | null
          total_pages?: number | null
          rating?: number | null
          is_finished?: boolean
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          book_title?: string
          author?: string | null
          content?: string | null
          pages_read?: number | null
          current_page?: number | null
          total_pages?: number | null
          rating?: number | null
          is_finished?: boolean
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      journals_gratitude: {
        Row: {
          id: string
          user_id: string
          content: string
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      // ==========================================
      // 習慣模組
      // ==========================================
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: string | null
          color: string | null
          frequency: 'daily' | 'weekly'
          target_days: number[]
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string | null
          color?: string | null
          frequency?: 'daily' | 'weekly'
          target_days?: number[]
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          frequency?: 'daily' | 'weekly'
          target_days?: number[]
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }

      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          date: string
          completed: boolean
          note: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          date?: string
          completed?: boolean
          note?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          date?: string
          completed?: boolean
          note?: string | null
          created_at?: string | null
        }
      }

      // ==========================================
      // 任務模組
      // ==========================================
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          is_important: boolean
          is_urgent: boolean
          due_date: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          is_important?: boolean
          is_urgent?: boolean
          due_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          is_important?: boolean
          is_urgent?: boolean
          due_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }

      // ==========================================
      // 課表模組
      // ==========================================
      schedule_slots: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          slot_number: number
          subject_name: string
          teacher: string | null
          location: string | null
          note: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          slot_number: number
          subject_name: string
          teacher?: string | null
          location?: string | null
          note?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          slot_number?: number
          subject_name?: string
          teacher?: string | null
          location?: string | null
          note?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }

      // ==========================================
      // 健康模組
      // ==========================================
      health_exercises: {
        Row: {
          id: string
          user_id: string
          exercise_type: string
          duration_minutes: number | null
          distance_km: number | null
          calories: number | null
          note: string | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          exercise_type: string
          duration_minutes?: number | null
          distance_km?: number | null
          calories?: number | null
          note?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          exercise_type?: string
          duration_minutes?: number | null
          distance_km?: number | null
          calories?: number | null
          note?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      health_metrics: {
        Row: {
          id: string
          user_id: string
          metric_type: 'weight' | 'blood_pressure' | 'sleep' | 'water'
          value_primary: number
          value_secondary: number | null
          note: string | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          metric_type: 'weight' | 'blood_pressure' | 'sleep' | 'water'
          value_primary: number
          value_secondary?: number | null
          note?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          metric_type?: 'weight' | 'blood_pressure' | 'sleep' | 'water'
          value_primary?: number
          value_secondary?: number | null
          note?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      // ==========================================
      // 收支模組
      // ==========================================
      finance_records: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description: string | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          description?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }

      // ==========================================
      // 學習系統（保留現有）
      // ==========================================
      subjects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          cover_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          cover_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          cover_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }

      topics: {
        Row: {
          id: string
          subject_id: string
          user_id: string
          title: string
          order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          subject_id: string
          user_id: string
          title: string
          order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          subject_id?: string
          user_id?: string
          title?: string
          order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }

      units: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          title: string
          content: string | null
          mindmap_url: string | null
          order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          title: string
          content?: string | null
          mindmap_url?: string | null
          order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          title?: string
          content?: string | null
          mindmap_url?: string | null
          order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }

      question_types: {
        Row: {
          id: string
          name: string
          label: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          label: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          label?: string
          created_at?: string | null
        }
      }

      questions: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          question_type_id: string
          content: string
          options: Json | null
          answer: Json | null
          explanation: string | null
          is_group: boolean | null
          parent_id: string | null
          attempt_count: number
          wrong_count: number
          last_attempted_at: string | null
          marked_for_review: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          question_type_id: string
          content: string
          options?: Json | null
          answer?: Json | null
          explanation?: string | null
          is_group?: boolean | null
          parent_id?: string | null
          attempt_count?: number
          wrong_count?: number
          last_attempted_at?: string | null
          marked_for_review?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          question_type_id?: string
          content?: string
          options?: Json | null
          answer?: Json | null
          explanation?: string | null
          is_group?: boolean | null
          parent_id?: string | null
          attempt_count?: number
          wrong_count?: number
          last_attempted_at?: string | null
          marked_for_review?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }

      question_topics: {
        Row: {
          question_id: string
          topic_id: string
          created_at: string | null
        }
        Insert: {
          question_id: string
          topic_id: string
          created_at?: string | null
        }
        Update: {
          question_id?: string
          topic_id?: string
          created_at?: string | null
        }
      }

      decks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }

      flashcards: {
        Row: {
          id: string
          user_id: string
          unit_id: string | null
          deck_id: string | null
          front: string
          back: string
          next_review_at: string | null
          interval: number | null
          ease_factor: number | null
          repetition_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          unit_id?: string | null
          deck_id?: string | null
          front: string
          back: string
          next_review_at?: string | null
          interval?: number | null
          ease_factor?: number | null
          repetition_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string | null
          deck_id?: string | null
          front?: string
          back?: string
          next_review_at?: string | null
          interval?: number | null
          ease_factor?: number | null
          repetition_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================
// 便利類型別名
// ============================================

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// ============================================
// 常用類型別名
// ============================================

// 用戶
export type Profile = Tables<'profiles'>

// 日誌
export type JournalLife = Tables<'journals_life'>
export type JournalLearning = Tables<'journals_learning'>
export type JournalReading = Tables<'journals_reading'>
export type JournalGratitude = Tables<'journals_gratitude'>

// 習慣
export type Habit = Tables<'habits'>
export type HabitLog = Tables<'habit_logs'>

// 任務
export type Task = Tables<'tasks'>

// 課表
export type ScheduleSlot = Tables<'schedule_slots'>

// 健康
export type HealthExercise = Tables<'health_exercises'>
export type HealthMetric = Tables<'health_metrics'>

// 收支
export type FinanceRecord = Tables<'finance_records'>

// 學習系統
export type Subject = Tables<'subjects'>
export type Topic = Tables<'topics'>
export type Unit = Tables<'units'>
export type QuestionType = Tables<'question_types'>
export type Question = Tables<'questions'>
export type QuestionTopic = Tables<'question_topics'>
export type Deck = Tables<'decks'>
export type Flashcard = Tables<'flashcards'>

// ============================================
// 擴展類型（含關聯資料）
// ============================================

// 習慣含今日打卡狀態
export type HabitWithTodayLog = Habit & {
  todayLog?: HabitLog | null
}

// 任務四象限類型
export type TaskQuadrant = 
  | 'do_first'      // 重要且緊急
  | 'schedule'      // 重要不緊急
  | 'delegate'      // 緊急不重要
  | 'eliminate'     // 不重要不緊急

// 取得任務象限
export function getTaskQuadrant(task: Task): TaskQuadrant {
  if (task.is_important && task.is_urgent) return 'do_first'
  if (task.is_important && !task.is_urgent) return 'schedule'
  if (!task.is_important && task.is_urgent) return 'delegate'
  return 'eliminate'
}

// 課表時段資訊
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

// 星期對照
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: '週一',
  2: '週二',
  3: '週三',
  4: '週四',
  5: '週五',
  6: '週六',
  7: '週日',
}

// 心情對照
export const MOOD_LABELS: Record<number, string> = {
  1: '😢 很差',
  2: '😕 不好',
  3: '😐 普通',
  4: '🙂 不錯',
  5: '😄 很棒',
}

// 健康數值類型對照
export const METRIC_TYPE_LABELS: Record<string, string> = {
  weight: '體重 (kg)',
  blood_pressure: '血壓 (mmHg)',
  sleep: '睡眠 (小時)',
  water: '飲水 (ml)',
}

// 收支分類建議
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
