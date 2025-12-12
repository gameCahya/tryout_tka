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

export type AnswerState = {
  answers: number[];
  multipleAnswers: number[][];
  reasoningAnswers: { [key: number]: { [key: number]: 'benar' | 'salah' } };
};

export type QuestionStatus = 'answered' | 'current' | 'unanswered';