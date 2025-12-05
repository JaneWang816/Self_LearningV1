// types/supabase.ts
// 對應 schema_v2.sql 的 TypeScript 類型定義

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "units_topic_id_fkey"
            columns: ["topic_id"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "questions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_question_type_id_fkey"
            columns: ["question_type_id"]
            referencedRelation: "question_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "question_topics_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_topics_topic_id_fkey"
            columns: ["topic_id"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "decks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            referencedRelation: "decks"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================
// 便利型別
// ============================================

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// 常用型別別名
export type Profile = Tables<'profiles'>
export type Subject = Tables<'subjects'>
export type Topic = Tables<'topics'>
export type Unit = Tables<'units'>
export type QuestionType = Tables<'question_types'>
export type Question = Tables<'questions'>
export type QuestionTopic = Tables<'question_topics'>
export type Deck = Tables<'decks'>
export type Flashcard = Tables<'flashcards'>