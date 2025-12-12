// app/tryout/types/tryout.ts

export type Question = {
  id: string;
  tryout_id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[] | null;
  reasoning_answers: { [key: number]: 'benar' | 'salah' } | null;
  question_type: 'single' | 'multiple' | 'reasoning';
  explanation: string;
  created_at: string;
  category_id: string | null;
};


export type AnswerState = {
  answers: number[];
  multipleAnswers: number[][];
  reasoningAnswers: { [key: number]: { [key: number]: 'benar' | 'salah' } };
};

export type QuestionStatus = 'answered' | 'current' | 'unanswered';

