export type UserAnswer = {
  question_id: string;
  user_answer: number;
  user_answers: number[];
  user_reasoning: { [key: number]: 'benar' | 'salah' };
  is_correct: boolean;
};
