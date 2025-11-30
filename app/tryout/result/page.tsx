'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const score = parseInt(searchParams.get('score') || '0', 10);
  const total = parseInt(searchParams.get('total') || '0', 10);
  const durationSeconds = parseInt(searchParams.get('duration') || '0', 10);

  useEffect(() => {
    if (isNaN(score) || isNaN(total) || total <= 0) {
      router.push('/dashboard');
    }
  }, [score, total, router]);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow dark:shadow-gray-700/50 text-center">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Hasil Tryout</h1>

          <div className="mb-8">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {score} / {total}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              ({percentage}%)
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Waktu pengerjaan: {minutes} menit {seconds} detik
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}