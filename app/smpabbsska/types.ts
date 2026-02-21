export interface Tryout {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export type QuestionType = 'single' | 'multiple' | 'essay';

export interface Question {
  id: string;
  tryout_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer_index: number | null;
  correct_answers: number[] | null;
  essay_answer: string | null;  // kunci jawaban / rubrik penilaian
  question_points: number;
  question_order: number;
  image_url: string | null;
}

export interface TryoutForm {
  title: string;
  description: string;
  duration_minutes: number;
}

export interface QuestionForm {
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[];
  essay_answer: string;
  question_points: number;
  image_url: string | null;
}

export const EMPTY_QUESTION: QuestionForm = {
  question_text: '',
  question_type: 'single',
  options: ['', '', '', ''],
  correct_answer_index: 0,
  correct_answers: [],
  essay_answer: '',
  question_points: 1,
  image_url: null,
};