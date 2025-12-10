'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TryoutResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tryoutId, setTryoutId] = useState('');

  useEffect(() => {
    const scoreParam = searchParams.get('score');
    const totalParam = searchParams.get('total');
    const durationParam = searchParams.get('duration');
    const tryoutIdParam = searchParams.get('tryout_id');

    if (scoreParam && totalParam && durationParam) {
      setScore(parseInt(scoreParam));
      setTotal(parseInt(totalParam));
      setDuration(parseInt(durationParam));
      setTryoutId(tryoutIdParam || '');
    } else {
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} menit ${secs} detik`;
  };

  const getScoreMessage = () => {
    const percent = parseFloat(percentage);
    if (percent >= 90) return { text: 'Luar Biasa! 🎉', color: 'text-green-600' };
    if (percent >= 75) return { text: 'Sangat Baik! 👏', color: 'text-blue-600' };
    if (percent >= 60) return { text: 'Baik! 👍', color: 'text-yellow-600' };
    return { text: 'Tetap Semangat! 💪', color: 'text-orange-600' };
  };

  const message = getScoreMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Result Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="text-5xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tryout Selesai!
            </h1>
            <p className={`text-2xl font-semibold ${message.color}`}>
              {message.text}
            </p>
          </div>

          {/* Score Display */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl p-8 mb-6">
            <div className="text-center text-white">
              <p className="text-lg mb-2 text-blue-100">Skor Anda</p>
              <div className="text-6xl font-bold mb-2">
                {score}/{total}
              </div>
              <div className="text-3xl font-semibold">
                {percentage}%
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Benar</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">❌</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Salah</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{total - score}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Waktu</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatDuration(duration)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Penguasaan</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  parseFloat(percentage) >= 75
                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                    : parseFloat(percentage) >= 60
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-600'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tryoutId && (
              <button
                onClick={() => router.push(`/tryout/${tryoutId}/ranking`)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 dark:from-purple-600 dark:to-purple-800 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 dark:hover:from-purple-700 dark:hover:to-purple-900 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🏆</span>
                <span>Lihat Ranking</span>
              </button>
            )}
            <button
              onClick={() => router.push('/history')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📚</span>
                <span>Lihat History</span>
              </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 dark:from-green-600 dark:to-green-800 text-white rounded-lg hover:from-green-600 hover:to-green-800 dark:hover:from-green-700 dark:hover:to-green-900 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🏠</span>
                <span>Ke Dashboard</span>
              </button>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            💡 <span className="font-semibold">Tips:</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {parseFloat(percentage) >= 75
              ? 'Pertahankan performa hebat Anda! Terus berlatih untuk hasil yang lebih baik.'
              : 'Jangan menyerah! Setiap latihan membawa Anda lebih dekat ke kesuksesan.'}
          </p>
        </div>
      </div>
    </div>
  );
}