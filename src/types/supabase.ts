export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          country: string;
          country_code: string;
          phone: string;
          profession: string;
          license_number: string;
          experience_years: number;
          exam_interest: string;
          current_level: string;
          global_progress: number;
          daily_goal: number;
          daily_minutes_today: number;
          role: string;
          validation_status: string;
          validation_photo_url: string | null;
          validation_approved_at: string | null;
          validation_photo_delete_at: string | null;
          avatar_url: string | null;
          streak: number;
          last_active_date: string | null;
          total_xp: number;
          exam_path: string | null;
          is_blocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          country?: string;
          country_code?: string;
          phone?: string;
          profession?: string;
          license_number?: string;
          experience_years?: number;
          exam_interest?: string;
          current_level?: string;
          global_progress?: number;
          daily_goal?: number;
          daily_minutes_today?: number;
          role?: string;
          validation_status?: string;
          validation_photo_url?: string | null;
          avatar_url?: string | null;
          streak?: number;
          last_active_date?: string | null;
          total_xp?: number;
          exam_path?: string | null;
          is_blocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          country?: string;
          country_code?: string;
          phone?: string;
          profession?: string;
          license_number?: string;
          experience_years?: number;
          exam_interest?: string;
          current_level?: string;
          global_progress?: number;
          daily_goal?: number;
          daily_minutes_today?: number;
          role?: string;
          validation_status?: string;
          validation_photo_url?: string | null;
          validation_approved_at?: string | null;
          validation_photo_delete_at?: string | null;
          avatar_url?: string | null;
          streak?: number;
          last_active_date?: string | null;
          total_xp?: number;
          exam_path?: string | null;
          is_blocked?: boolean;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          level: string;
          order: number;
          title: string;
          subtitle: string;
          description: string;
          vocab_healthcare: Json;
          grammar_point: Json;
          content: Json;
          is_checkpoint: boolean;
          duration_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          level: string;
          order: number;
          title: string;
          subtitle?: string;
          description?: string;
          vocab_healthcare?: Json;
          grammar_point?: Json;
          content?: Json;
          is_checkpoint?: boolean;
          duration_minutes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: string;
          order?: number;
          title?: string;
          subtitle?: string;
          description?: string;
          vocab_healthcare?: Json;
          grammar_point?: Json;
          content?: Json;
          is_checkpoint?: boolean;
          duration_minutes?: number;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          score: number | null;
          time_spent: number;
          vocab_score: number | null;
          grammar_score: number | null;
          listening_score: number | null;
          speaking_score: number | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          score?: number | null;
          time_spent?: number;
          vocab_score?: number | null;
          grammar_score?: number | null;
          listening_score?: number | null;
          speaking_score?: number | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          score?: number | null;
          time_spent?: number;
          vocab_score?: number | null;
          grammar_score?: number | null;
          listening_score?: number | null;
          speaking_score?: number | null;
          completed_at?: string | null;
        };
      };
      placement_results: {
        Row: {
          id: string;
          user_id: string;
          initial_level: string;
          score: number;
          answers: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          initial_level: string;
          score: number;
          answers?: Json;
          created_at?: string;
        };
        Update: {
          initial_level?: string;
          score?: number;
          answers?: Json;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
      speaking_recordings: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string | null;
          audio_url: string;
          transcript: string | null;
          band_score_estimate: number | null;
          pronunciation_score: number | null;
          fluency_score: number | null;
          feedback: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id?: string | null;
          audio_url: string;
          transcript?: string | null;
          band_score_estimate?: number | null;
          pronunciation_score?: number | null;
          fluency_score?: number | null;
          feedback?: Json | null;
          created_at?: string;
        };
        Update: {
          transcript?: string | null;
          band_score_estimate?: number | null;
          pronunciation_score?: number | null;
          fluency_score?: number | null;
          feedback?: Json | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
