// app/tryout/types/tryout.ts

export type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers?: number[] | null;
  question_type?: string;
  reasoning_answers?: { [key: number]: 'benar' | 'salah' } | null;
  explanation?: string;
  image_url?: string | null;
  tryout_id?: string;
  created_at?: string;
};

export type Tryout = {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
  created_at?: string;
  start_time?: string | null;
  end_time?: string | null;
  teacher_id?: string | null;
  school?: string | null;
  is_shared?: boolean | null;
  explanation_price?: number | null;
  // Tambahan field untuk join atau computed properties
  teacher_name?: string; // Jika Anda ingin menampilkan nama guru
  subject?: string; // Jika ada field subject
  description?: string; // Jika ada field description
};

// Atau jika Anda ingin lebih ketat dan sesuai dengan database
export type TryoutFromDB = {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  teacher_id: string | null;
  school: string | null;
  is_shared: boolean | null;
  explanation_price: number | null;
};

export type AnswerState = {
  answers: number[];
  multipleAnswers: number[][];
  reasoningAnswers: { [key: number]: { [key: number]: 'benar' | 'salah' } };
};

export type QuestionStatus = 'answered' | 'current' | 'unanswered';

// Optional: Tipe untuk data yang di-insert/update
export type TryoutInsert = {
  title: string;
  total_questions: number;
  duration_minutes: number;
  start_time?: string | null;
  end_time?: string | null;
  teacher_id?: string | null;
  school?: string | null;
  is_shared?: boolean | null;
  explanation_price?: number | null;
};

// Optional: Tipe untuk hasil join dengan tabel lain
export type TryoutWithTeacher = Tryout & {
  teacher?: {
    id: string;
    full_name?: string;
    email?: string;
  };
};