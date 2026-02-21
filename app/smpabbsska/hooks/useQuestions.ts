import { useState, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Question, QuestionForm, Tryout } from '../types';

export function useQuestions(
  toast: (msg: string, isError?: boolean) => void,
  onQuestionCountChange: (tryoutId: string, count: number) => void
) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadQuestions = useCallback(async (tryoutId: string) => {
    const { data, error } = await supabase
      .from('smpabbs_questions')
      .select('*')
      .eq('tryout_id', tryoutId)
      .order('question_order', { ascending: true });
    if (!error) setQuestions(data || []);
  }, [supabase]);

  // ===== IMAGE HELPERS =====
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('File harus berupa gambar (JPG, PNG, dll)', true); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Ukuran gambar maksimal 2MB', true); return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('questions')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('questions').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      toast(`Gagal upload gambar: ${err instanceof Error ? err.message : 'Error'}`, true);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/storage/v1/object/public/questions/');
      if (urlParts.length < 2) return;
      await supabase.storage.from('questions').remove([urlParts[1]]);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  // ===== QUESTION CRUD =====
  const saveQuestion = async (
    form: QuestionForm,
    editingQuestion: Question | null,
    selectedTryout: Tryout,
    onDone: () => void
  ) => {
    if (!form.question_text.trim()) { toast('Teks soal harus diisi', true); return; }
    if (form.question_type !== 'essay' && form.options.some(o => !o.trim())) {
      toast('Semua pilihan jawaban harus diisi', true); return;
    }
    if (form.question_type === 'multiple' && form.correct_answers.length === 0) {
      toast('Pilih minimal satu jawaban benar', true); return;
    }
    if (form.question_type === 'essay' && !form.essay_answer.trim()) {
      toast('Kunci jawaban / rubrik penilaian harus diisi', true); return;
    }

    setSavingQuestion(true);
    try {
      let finalImageUrl = form.image_url;

      if (imageFile) {
        if (editingQuestion?.image_url) await deleteImageFromStorage(editingQuestion.image_url);
        const uploadedUrl = await uploadImageToSupabase(imageFile);
        if (!uploadedUrl) { setSavingQuestion(false); return; }
        finalImageUrl = uploadedUrl;
      } else if (!imagePreview && editingQuestion?.image_url) {
        await deleteImageFromStorage(editingQuestion.image_url);
        finalImageUrl = null;
      }

      const isEssay = form.question_type === 'essay';
      const questionData = {
        tryout_id: selectedTryout.id,
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        options: isEssay ? null : form.options.map(o => o.trim()),
        correct_answer_index: form.question_type === 'single' ? form.correct_answer_index : null,
        correct_answers: form.question_type === 'multiple' ? form.correct_answers : null,
        essay_answer: isEssay ? form.essay_answer.trim() : null,
        question_points: form.question_points,
        question_order: editingQuestion ? editingQuestion.question_order : questions.length + 1,
        image_url: finalImageUrl,
      };

      if (editingQuestion) {
        const { error } = await supabase.from('smpabbs_questions').update(questionData).eq('id', editingQuestion.id);
        if (error) throw error;
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } as Question : q));
        toast('Soal berhasil diperbarui.');
      } else {
        const { data, error } = await supabase.from('smpabbs_questions').insert(questionData).select().single();
        if (error) throw error;
        const newQuestions = [...questions, data];
        setQuestions(newQuestions);
        await supabase.from('smpabbs_tryouts').update({ total_questions: newQuestions.length }).eq('id', selectedTryout.id);
        onQuestionCountChange(selectedTryout.id, newQuestions.length);
        toast('Soal berhasil ditambahkan!');
      }
      onDone();
    } catch (err) {
      toast(`Gagal: ${err instanceof Error ? err.message : 'Error'}`, true);
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteQuestion = async (questionId: string, tryoutId: string) => {
    if (!confirm('Hapus soal ini?')) return;
    try {
      const question = questions.find(q => q.id === questionId);
      if (question?.image_url) await deleteImageFromStorage(question.image_url);

      const { error } = await supabase.from('smpabbs_questions').delete().eq('id', questionId);
      if (error) throw error;

      const newQuestions = questions.filter(q => q.id !== questionId);
      setQuestions(newQuestions);
      await supabase.from('smpabbs_tryouts').update({ total_questions: newQuestions.length }).eq('id', tryoutId);
      onQuestionCountChange(tryoutId, newQuestions.length);
      toast('Soal berhasil dihapus.');
    } catch {
      toast('Gagal menghapus soal.', true);
    }
  };

  const resetQuestions = () => setQuestions([]);

  return {
    questions,
    savingQuestion,
    imageFile,
    imagePreview,
    uploadingImage,
    fileInputRef,
    loadQuestions,
    handleImageChange,
    clearImage,
    setImagePreview,
    saveQuestion,
    deleteQuestion,
    resetQuestions,
  };
}