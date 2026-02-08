// app/smpabbsska/tryout/types.ts
export interface ProfileData {
  id: string;
  auth_user_id: string;
  username: string;
  full_name: string;
  phone: string;
  school?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface RawQuestionData {
  id: string;
  tryout_id: string;
  question_text: string;
  question_type: 'single' | 'multiple' | 'reasoning' | 'true_false_matrix';
  options: string[];
  correct_answer_index: number | null;
  correct_answers: number[] | null;
  statements: string[] | null;
  statements_answers: number[] | null;
  context: string | null;
  question_points: number;
  question_order: number;
  explanation: string | null;
  created_at: string;
}

export interface TryoutQuestion {
  id: string;
  question_text: string;
  question_type: 'single' | 'multiple' | 'reasoning' | 'true_false_matrix';
  options: string[];
  statements?: string[];
  statementsAnswers?: number[];
  context?: string;
  points: number;
  order: number;
  // Untuk soal single choice
  correct_answer_index?: number;
  // Untuk soal multiple choice
  correct_answers?: number[];
}

export interface TryoutData {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
}