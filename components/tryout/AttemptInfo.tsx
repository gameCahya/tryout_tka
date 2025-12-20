'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AttemptInfoProps = {
  tryoutId: string;
  userId: string;
};

type ResultInfo = {
  attempt_number: number;
  score: number;
  is_locked: boolean;
  completed_at: string;
};

export default function AttemptInfo({ tryoutId, userId }: AttemptInfoProps) {
  const [attempts, setAttempts] = useState<number>(0);
  const [results, setResults] = useState<ResultInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, [tryoutId, userId]);

  const fetchAttempts = async () => {
    try {
      // Get attempt count
      const { data: countData, error: countError } = await supabase
        .rpc('get_user_tryout_attempts', {
          p_user_id: userId,
          p_tryout_id: tryoutId,
        });

      if (!countError && countData !== null) {
        setAttempts(countData);
      }

      // Get results detail
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select('attempt_number, score, is_locked, completed_at')
        .eq('user_id', userId)
        .eq('tryout_id', tryoutId)
        .order('attempt_number', { ascending: true });

      if (!resultsError && resultsData) {
        setResults(resultsData);
      }
    } catch (err) {
      console.error('Error fetching attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const lockedResult = results.find(r => r.is_locked);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            📝 Percobaan Anda: {attempts}/3
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {attempts === 0 && "Percobaan pertama akan disimpan untuk ranking"}
            {attempts === 1 && "Anda masih punya 2 slot percobaan"}
            {attempts === 2 && "Anda masih punya 1 slot percobaan"}
            {attempts >= 3 && "Percobaan selanjutnya akan menimpa percobaan ke-2 atau ke-3"}
          </p>
        </div>
        <div className="text-2xl">
          {attempts === 0 && "🆕"}
          {attempts === 1 && "1️⃣"}
          {attempts === 2 && "2️⃣"}
          {attempts >= 3 && "🔄"}
        </div>
      </div>

      {/* Ranking Info */}
      {lockedResult && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                🏆 Skor untuk Ranking
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Percobaan #{lockedResult.attempt_number}: <span className="font-bold">{lockedResult.score} poin</span>
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
              <span className="text-xs font-bold text-yellow-800 dark:text-yellow-200">🔒 LOCKED</span>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {results.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 Riwayat Percobaan:
          </p>
          <div className="space-y-1">
            {results.map((result) => (
              <div 
                key={result.attempt_number}
                className={`text-xs flex items-center justify-between p-2 rounded ${
                  result.is_locked 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' 
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <span className="text-blue-700 dark:text-blue-300">
                  Percobaan #{result.attempt_number}: {result.score} poin
                </span>
                {result.is_locked && (
                  <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                    🔒 Ranking
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {attempts > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 <strong>Info:</strong> Hanya percobaan pertama yang digunakan untuk ranking. Percobaan lainnya untuk latihan saja.
          </p>
        </div>
      )}
    </div>
  );
}