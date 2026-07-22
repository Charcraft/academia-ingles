// Shared types for the app - also used by future NCLEX app
export type CEFRLevel = "A0" | "A1" | "A2" | "B1" | "B2" | "C1";
export type UserRole = "student" | "admin" | "case_manager";
export type ValidationStatus = "pending" | "approved" | "rejected";
export type ExamType = "ielts_academic" | "toefl_ibt" | "pte_academic" | "undecided";
export type PlanType = "free" | "premium";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Profile {
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
  exam_interest: ExamType;
  current_level: CEFRLevel;
  global_progress: number;
  daily_goal: number;
  daily_minutes_today: number;
  role: UserRole;
  validation_status: ValidationStatus;
  validation_photo_url: string | null;
  validation_approved_at: string | null;
  validation_photo_delete_at: string | null;
  avatar_url: string | null;
  streak: number;
  last_active_date: string | null;
  total_xp: number;
  exam_path: ExamType | null;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  level: CEFRLevel;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  vocab_healthcare: VocabItem[];
  grammar_point: GrammarPoint;
  content: LessonContent;
  is_checkpoint: boolean;
  duration_minutes: number;
  created_at: string;
}

export interface VocabItem {
  en: string;
  es?: string;
  definition?: string;
  context: string;
}

export interface GrammarPoint {
  topic: string;
  explanation: string;
  examples: string[];
}

export interface LessonContent {
  listening?: {
    script: string;
    questions: QuizQuestion[];
  };
  quiz?: QuizQuestion[];
  is_checkpoint?: boolean;
  review_lessons?: number[];
  passing_score?: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

export interface UserProgress {
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
}

export interface PlacementResult {
  id: string;
  user_id: string;
  initial_level: CEFRLevel;
  score: number;
  answers: Record<string, number>;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpeakingRecording {
  id: string;
  user_id: string;
  lesson_id: string | null;
  audio_url: string;
  transcript: string | null;
  band_score_estimate: number | null;
  pronunciation_score: number | null;
  fluency_score: number | null;
  feedback: Record<string, unknown> | null;
  created_at: string;
}

// Admin types
export interface StudentWithProfile extends Profile {
  last_progress?: UserProgress;
  speaking_score_avg?: number;
}

export interface AdminAlert {
  type: "inactive" | "streak_drop" | "exam_ready" | "high_potential";
  students: StudentWithProfile[];
}

// Placement test
export interface PlacementQuestion {
  id: number;
  type: "grammar" | "vocabulary" | "listening";
  question: string;
  options: string[];
  correct: number;
  level: CEFRLevel;
  audioUrl?: string;
}

// Countries list for registration
export interface Country {
  name: string;
  code: string;
  flag: string;
  phoneCode: string;
}
