import { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Tryout, TryoutForm } from '../types';

export function useTryouts(toast: (msg: string, isError?: boolean) => void) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [savingTryout, setSavingTryout] = useState(false);

  const loadTryouts = useCallback(async () => {
    const { data, error } = await supabase
      .from('smpabbs_tryouts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTryouts(data || []);
  }, [supabase]);

  const createTryout = async (
    form: TryoutForm,
    onSuccess: (tryout: Tryout) => void
  ) => {
    if (!form.title.trim()) { toast('Judul tryout harus diisi', true); return; }
    setSavingTryout(true);
    try {
      const { data, error } = await supabase
        .from('smpabbs_tryouts')
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          duration_minutes: form.duration_minutes,
          total_questions: 0,
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      setTryouts(prev => [data, ...prev]);
      toast('Tryout berhasil dibuat! Sekarang tambahkan soal.');
      onSuccess(data);
    } catch (err) {
      toast(`Gagal: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`, true);
    } finally {
      setSavingTryout(false);
    }
  };

  const deleteTryout = async (
    tryout: Tryout,
    selectedId: string | undefined,
    onDeleted: () => void
  ) => {
    if (!confirm(`Hapus tryout "${tryout.title}"? Semua soal akan ikut terhapus.`)) return;
    try {
      const { error } = await supabase.from('smpabbs_tryouts').delete().eq('id', tryout.id);
      if (error) throw error;
      setTryouts(prev => prev.filter(t => t.id !== tryout.id));
      if (selectedId === tryout.id) onDeleted();
      toast('Tryout berhasil dihapus.');
    } catch {
      toast('Gagal menghapus tryout.', true);
    }
  };

  const toggleTryoutStatus = async (
    tryout: Tryout,
    onUpdated: (updated: Tryout) => void
  ) => {
    const { error } = await supabase
      .from('smpabbs_tryouts')
      .update({ is_active: !tryout.is_active })
      .eq('id', tryout.id);
    if (!error) {
      const updated = { ...tryout, is_active: !tryout.is_active };
      setTryouts(prev => prev.map(t => t.id === tryout.id ? updated : t));
      onUpdated(updated);
      toast(`Tryout ${!tryout.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    }
  };

  const updateTryoutQuestionCount = (tryoutId: string, count: number) => {
    setTryouts(prev => prev.map(t =>
      t.id === tryoutId ? { ...t, total_questions: count } : t
    ));
  };

  return {
    tryouts,
    savingTryout,
    loadTryouts,
    createTryout,
    deleteTryout,
    toggleTryoutStatus,
    updateTryoutQuestionCount,
  };
}
