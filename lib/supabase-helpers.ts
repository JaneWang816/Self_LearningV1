// lib/supabase-helpers.ts
// 提供類型安全的 Supabase 表操作

import { supabase } from './supabaseClient'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

/**
 * 獲取類型安全的表操作
 * 使用方式：
 *   const { data } = await typedTable('flashcards').select('*')
 *   await typedTable('flashcards').insert({ ... })
 */
export function typedTable<T extends TableName>(table: T) {
  return supabase.from(table) as ReturnType<typeof supabase.from<T>>
}

// 或者使用更簡單的類型斷言方式
export const tables = {
  profiles: () => supabase.from('profiles'),
  subjects: () => supabase.from('subjects'),
  topics: () => supabase.from('topics'),
  units: () => supabase.from('units'),
  question_types: () => supabase.from('question_types'),
  questions: () => supabase.from('questions'),
  question_topics: () => supabase.from('question_topics'),
  decks: () => supabase.from('decks'),
  flashcards: () => supabase.from('flashcards'),
  // 新模組
  journals_life: () => supabase.from('journals_life'),
  journals_learning: () => supabase.from('journals_learning'),
  journals_reading: () => supabase.from('journals_reading'),
  journals_gratitude: () => supabase.from('journals_gratitude'),
  habits: () => supabase.from('habits'),
  habit_logs: () => supabase.from('habit_logs'),
  tasks: () => supabase.from('tasks'),
  schedule_slots: () => supabase.from('schedule_slots'),
  health_exercises: () => supabase.from('health_exercises'),
  health_metrics: () => supabase.from('health_metrics'),
  finance_records: () => supabase.from('finance_records'),
} as const
