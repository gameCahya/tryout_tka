'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// ===================== DATA =====================
const CATEGORIES = [
  {
    id: 'akademik',
    label: 'Bidang Akademik',
    emoji: '📚',
    color: 'blue',
    soalRange: [1, 8],
    description: 'Kemampuan belajar, memahami pelajaran, dan prestasi akademik.',
    rekomendasi: 'Kamu cocok di jalur akademik seperti olimpiade sains, cerdas cermat, atau program akselerasi. Pertimbangkan jurusan IPA, IPS, atau program unggulan di SMP.',
  },
  {
    id: 'seni',
    label: 'Bidang Seni',
    emoji: '🎨',
    color: 'purple',
    soalRange: [9, 16],
    description: 'Kreativitas, ekspresi diri, dan apresiasi seni.',
    rekomendasi: 'Bakatmu ada di dunia seni! Ikuti ekstrakurikuler seni rupa, musik, tari, atau drama. Pertimbangkan jurusan seni di masa depan.',
  },
  {
    id: 'sosial',
    label: 'Bidang Sosial & Kepemimpinan',
    emoji: '🤝',
    color: 'green',
    soalRange: [17, 24],
    description: 'Kemampuan berinteraksi, memimpin, dan kepedulian sosial.',
    rekomendasi: 'Kamu punya jiwa pemimpin yang kuat! Aktif di OSIS, kegiatan sosial, atau organisasi sekolah akan sangat cocok untukmu.',
  },
  {
    id: 'teknologi',
    label: 'Bidang Teknologi & Logika',
    emoji: '💻',
    color: 'orange',
    soalRange: [25, 32],
    description: 'Kemampuan berpikir logis, teknologi, dan pemecahan masalah.',
    rekomendasi: 'Dunia teknologi menantimu! Ikuti klub coding, robotik, atau olimpiade informatika. Masa depan di bidang IT, engineering, atau data science sangat menjanjikan.',
  },
  {
    id: 'olahraga',
    label: 'Bidang Olahraga & Kinestetik',
    emoji: '⚽',
    color: 'red',
    soalRange: [33, 40],
    description: 'Kemampuan fisik, ketahanan tubuh, dan aktivitas kinestetik.',
    rekomendasi: 'Potensi atletikmu luar biasa! Ikuti ekstrakurikuler olahraga, pertimbangkan bergabung di klub atau sekolah olahraga berprestasi.',
  },
];

const QUESTIONS = [
  // Akademik (1-8)
  'Saya senang mengerjakan soal pelajaran yang menantang.',
  'Saya mudah memahami penjelasan guru di kelas.',
  'Saya suka membaca buku pelajaran atau pengetahuan umum.',
  'Saya tertarik mengikuti lomba akademik (olimpiade, cerdas cermat).',
  'Saya senang belajar secara mandiri di rumah.',
  'Saya menyukai pelajaran Matematika atau IPA.',
  'Saya terbiasa membuat rangkuman materi pelajaran.',
  'Nilai pelajaran menjadi hal yang penting bagi saya.',
  // Seni (9-16)
  'Saya senang menggambar, melukis, atau membuat desain.',
  'Saya suka bernyanyi atau bermain alat musik.',
  'Saya tertarik pada tari, drama, atau teater.',
  'Saya menikmati kegiatan membuat karya seni.',
  'Saya senang menonton pertunjukan seni.',
  'Saya suka mengekspresikan perasaan lewat seni.',
  'Saya tertarik mengikuti ekstrakurikuler seni.',
  'Saya senang mencoba hal kreatif dan imajinatif.',
  // Sosial (17-24)
  'Saya senang bekerja dalam kelompok.',
  'Saya mudah bergaul dengan teman baru.',
  'Saya sering diminta pendapat oleh teman.',
  'Saya suka membantu teman yang kesulitan.',
  'Saya tertarik menjadi pengurus kelas atau OSIS.',
  'Saya berani berbicara di depan umum.',
  'Saya senang berdiskusi dan bertukar pendapat.',
  'Saya peduli pada masalah di sekitar saya.',
  // Teknologi (25-32)
  'Saya tertarik pada komputer dan teknologi.',
  'Saya senang mencoba aplikasi atau software baru.',
  'Saya suka bermain game yang membutuhkan strategi.',
  'Saya tertarik belajar coding atau pemrograman.',
  'Saya mudah memahami cara kerja alat elektronik.',
  'Saya suka memecahkan masalah dengan logika.',
  'Saya senang mencari solusi dari suatu masalah.',
  'Saya tertarik pada bidang robotik atau sains terapan.',
  // Olahraga (33-40)
  'Saya senang berolahraga secara rutin.',
  'Saya merasa nyaman melakukan aktivitas fisik.',
  'Saya tertarik mengikuti lomba olahraga.',
  'Saya lebih suka belajar sambil praktik langsung.',
  'Saya memiliki daya tahan fisik yang baik.',
  'Saya senang bergerak daripada duduk lama.',
  'Saya tertarik pada kegiatan luar ruangan.',
  'Saya ingin berprestasi di bidang olahraga.',
];

const ANSWER_OPTIONS = [
  { label: 'SS', desc: 'Sangat Sesuai', value: 4 },
  { label: 'S', desc: 'Sesuai', value: 3 },
  { label: 'TS', desc: 'Tidak Sesuai', value: 2 },
  { label: 'STS', desc: 'Sangat Tidak Sesuai', value: 1 },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string; bar: string }> = {
  blue: {
    bg: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500',
    light: 'bg-blue-50 dark:bg-blue-900/20',
    bar: 'from-blue-500 to-blue-600',
  },
  purple: {
    bg: 'bg-purple-600',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500',
    light: 'bg-purple-50 dark:bg-purple-900/20',
    bar: 'from-purple-500 to-purple-600',
  },
  green: {
    bg: 'bg-green-600',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500',
    light: 'bg-green-50 dark:bg-green-900/20',
    bar: 'from-green-500 to-green-600',
  },
  orange: {
    bg: 'bg-orange-600',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500',
    light: 'bg-orange-50 dark:bg-orange-900/20',
    bar: 'from-orange-500 to-orange-600',
  },
  red: {
    bg: 'bg-red-600',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500',
    light: 'bg-red-50 dark:bg-red-900/20',
    bar: 'from-red-500 to-red-600',
  },
};

function getInterpretasi(score: number): { label: string; color: string } {
  if (score >= 26) return { label: 'Minat & Bakat Sangat Dominan', color: 'text-green-600 dark:text-green-400' };
  if (score >= 20) return { label: 'Minat & Bakat Cukup Kuat', color: 'text-blue-600 dark:text-blue-400' };
  if (score >= 14) return { label: 'Minat & Bakat Sedang', color: 'text-yellow-600 dark:text-yellow-400' };
  return { label: 'Minat & Bakat Rendah', color: 'text-gray-500 dark:text-gray-400' };
}

// ===================== TYPES =====================
interface ProfileData {
  id: string;
  auth_user_id: string;
  full_name: string;
  role: string;
}

// ===================== MAIN =====================
export default function AsesmenPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/smpabbsska/login'); return; }

      const { data: profileData } = await supabase
        .from('smpabbs_profiles')
        .select('id, auth_user_id, full_name, role')
        .eq('auth_user_id', session.user.id)
        .single();

      if (profileData) setProfile(profileData);
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  const handleAnswer = (questionIndex: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const calculateScores = () => {
    return CATEGORIES.map(cat => {
      const [start, end] = cat.soalRange;
      let score = 0;
      for (let i = start - 1; i < end; i++) {
        score += answers[i] || 0;
      }
      return { ...cat, score };
    });
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const categoryQuestions = (catIndex: number) => {
    const [start, end] = CATEGORIES[catIndex].soalRange;
    return QUESTIONS.slice(start - 1, end).map((q, i) => ({ text: q, index: start - 1 + i }));
  };

  const catAnsweredCount = (catIndex: number) => {
    const [start, end] = CATEGORIES[catIndex].soalRange;
    let count = 0;
    for (let i = start - 1; i < end; i++) {
      if (answers[i] !== undefined) count++;
    }
    return count;
  };

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Memuat asesmen...</p>
        </div>
      </div>
    );
  }

  // ===================== HASIL =====================
  if (submitted) {
    const scores = calculateScores().sort((a, b) => b.score - a.score);
    const topScore = scores[0];
    const hasCombinasi = scores[1].score >= topScore.score - 3;

    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-green-600 flex items-center justify-center text-white font-bold text-sm">A</div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Hasil Asesmen Minat & Bakat</span>
            </div>
            <Link href="/smpabbsska/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Dashboard</Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Hero Result Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-green-600 px-8 py-8 text-white text-center">
              <div className="text-5xl mb-3">{topScore.emoji}</div>
              <h1 className="text-2xl font-bold mb-1">Hasil Asesmen Minat & Bakat</h1>
              <p className="opacity-90 text-lg">{profile?.full_name}</p>
              <p className="opacity-75 text-sm mt-1">SMP ABBS Surakarta</p>
            </div>

            <div className="px-8 py-6">
              {/* Dominant Badge */}
              <div className="text-center mb-6">
                <div className="inline-flex flex-col items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Minat & Bakat Dominan</span>
                  <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-lg shadow-lg ${COLOR_MAP[topScore.color].bg}`}>
                    <span className="text-2xl">{topScore.emoji}</span>
                    {topScore.label}
                  </div>
                  {hasCombinasi && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Kombinasi dengan</span>
                      <span className={`text-sm font-semibold ${COLOR_MAP[scores[1].color].text}`}>
                        {scores[1].emoji} {scores[1].label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rekomendasi */}
              <div className={`rounded-xl p-5 mb-6 ${COLOR_MAP[topScore.color].light} border ${COLOR_MAP[topScore.color].border}`}>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">💡 Rekomendasi</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{topScore.rekomendasi}</p>
                {hasCombinasi && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                    Karena dua bidang memiliki skor yang hampir sama, kamu memiliki <strong>bakat kombinasi</strong> — manfaatkan keduanya!
                  </p>
                )}
              </div>

              {/* Kesimpulan */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">📋 Kesimpulan Hasil Asesmen</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Berdasarkan hasil asesmen, <strong>{profile?.full_name}</strong> menunjukkan minat dan bakat dominan pada bidang{' '}
                  <strong className={COLOR_MAP[topScore.color].text}>{topScore.label}</strong>, dengan skor tertinggi{' '}
                  <strong>{topScore.score}</strong> dari 32 poin. Siswa cenderung menyukai aktivitas yang berkaitan dengan{' '}
                  {topScore.description.toLowerCase()}
                  {hasCombinasi && (
                    <> Bidang <strong className={COLOR_MAP[scores[1].color].text}>{scores[1].label}</strong> juga menunjukkan potensi yang kuat dengan skor {scores[1].score}.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Score Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-5">📊 Skor Per Bidang</h2>
            <div className="space-y-4">
              {scores.map((cat, idx) => {
                const pct = Math.round((cat.score / 32) * 100);
                const interp = getInterpretasi(cat.score);
                const colors = COLOR_MAP[cat.color];
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{cat.label}</span>
                        {idx === 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">🏆 Tertinggi</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${colors.text}`}>{cat.score}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">/32</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-1">
                      <div
                        className={`h-3 rounded-full bg-linear-to-r ${colors.bar} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${interp.color}`}>{interp.label}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Keterangan Skor</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { range: '26–32', label: 'Sangat Dominan', color: 'text-green-600' },
                  { range: '20–25', label: 'Cukup Kuat', color: 'text-blue-600' },
                  { range: '14–19', label: 'Sedang', color: 'text-yellow-600' },
                  { range: '8–13', label: 'Rendah', color: 'text-gray-500' },
                ].map(k => (
                  <div key={k.range} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 text-center">
                    <p className={`text-sm font-bold ${k.color}`}>{k.range}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabel Detail */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">📝 Detail Jawaban Per Soal</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pernyataan</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Jawaban</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {CATEGORIES.map(cat => {
                    const colors = COLOR_MAP[cat.color];
                    const [start, end] = cat.soalRange;
                    return [
                      <tr key={`header-${cat.id}`}>
                        <td colSpan={4} className={`px-4 py-2 ${colors.light}`}>
                          <span className={`text-xs font-bold ${colors.text}`}>{cat.emoji} {cat.label} (Soal {start}–{end})</span>
                        </td>
                      </tr>,
                      ...QUESTIONS.slice(start - 1, end).map((q, qi) => {
                        const absIdx = start - 1 + qi;
                        const ans = answers[absIdx];
                        const opt = ANSWER_OPTIONS.find(o => o.value === ans);
                        return (
                          <tr key={absIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono">{start + qi}</td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{q}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                ans === 4 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                ans === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                ans === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {opt?.label || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{ans || 0}</td>
                          </tr>
                        );
                      }),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setSubmitted(false); setAnswers({}); setActiveCategory(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex-1 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              🔄 Ulangi Asesmen
            </button>
            <Link href="/smpabbsska/dashboard"
              className="flex-1 py-3 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold text-center hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md">
              🏠 Kembali ke Dashboard
            </Link>
          </div>

          <div className="text-center text-sm text-gray-400 dark:text-gray-500 pb-4">
            © 2025 SMP ABBS Surakarta — Asesmen Minat & Bakat
          </div>
        </main>
      </div>
    );
  }

  // ===================== FORM =====================
  const currentCat = CATEGORIES[activeCategory];
  const currentColors = COLOR_MAP[currentCat.color];
  const currentQuestions = categoryQuestions(activeCategory);
  const currentAnswered = catAnsweredCount(activeCategory);
  const isLastCategory = activeCategory === CATEGORIES.length - 1;
  const canProceed = currentAnswered === 8;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-green-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-gray-900 dark:text-white text-sm hidden sm:block">Asesmen Minat & Bakat</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {answeredCount}/{totalQuestions} dijawab
            </div>
            <div className="w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="h-2 rounded-full bg-linear-to-r from-blue-500 to-green-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Petunjuk — hanya tampil di awal */}
        {activeCategory === 0 && answeredCount === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">📋 Asesmen Minat & Bakat</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Halo, <strong>{profile?.full_name}</strong>! Ikuti asesmen ini untuk mengetahui minat dan bakatmu.</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📌 Petunjuk Pengerjaan</p>
              {[
                'Bacalah setiap pernyataan dengan saksama.',
                'Beri tanda pada jawaban yang paling sesuai dengan dirimu.',
                'Tidak ada jawaban benar atau salah. Jawablah dengan jujur.',
              ].map((p, i) => (
                <p key={i} className="text-sm text-blue-700 dark:text-blue-400 flex gap-2">
                  <span className="shrink-0 font-bold">{i + 1}.</span>{p}
                </p>
              ))}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-2 border-t border-blue-200 dark:border-blue-800">
                {ANSWER_OPTIONS.map(opt => (
                  <div key={opt.label} className="text-center bg-white dark:bg-gray-700 rounded-lg py-2 px-3">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat, idx) => {
            const answered = catAnsweredCount(idx);
            const done = answered === 8;
            const active = activeCategory === idx;
            const catColors = COLOR_MAP[cat.color];
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(idx)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? `bg-white dark:bg-gray-800 shadow-md border-2 ${catColors.border} ${catColors.text}`
                    : done
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700'
                    : 'bg-white/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label.replace('Bidang ', '')}</span>
                {done && <span className="text-green-500">✓</span>}
                <span className={`text-xs px-1.5 rounded-full font-bold ${
                  done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  answered > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>{answered}/8</span>
              </button>
            );
          })}
        </div>

        {/* Current Category Questions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 ${currentColors.light}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCat.emoji}</span>
              <div>
                <h2 className={`font-bold ${currentColors.text}`}>{currentCat.label}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Soal {currentCat.soalRange[0]}–{currentCat.soalRange[1]} · {currentAnswered}/8 dijawab</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {currentQuestions.map(({ text, index }, qi) => {
              const selected = answers[index];
              return (
                <div key={index} className="px-5 py-4">
                  <div className="flex gap-3 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      selected ? `${currentColors.bg} text-white` : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {currentCat.soalRange[0] + qi}
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{text}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 ml-10">
                    {ANSWER_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => handleAnswer(index, opt.value)}
                        className={`py-2.5 rounded-xl border-2 text-center transition-all ${
                          selected === opt.value
                            ? `${currentColors.border} ${currentColors.light} ${currentColors.text} shadow-sm`
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-xs hidden sm:block opacity-70">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {activeCategory > 0 && (
            <button
              onClick={() => setActiveCategory(prev => prev - 1)}
              className="px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Sebelumnya
            </button>
          )}
          <div className="flex-1" />
          {!isLastCategory ? (
            <button
              onClick={() => setActiveCategory(prev => prev + 1)}
              disabled={!canProceed}
              className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${
                canProceed
                  ? 'bg-linear-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 hover:shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Berikutnya →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions}
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm ${
                answeredCount >= totalQuestions
                  ? 'bg-linear-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {answeredCount >= totalQuestions ? '✅ Lihat Hasil' : `Jawab dulu (${totalQuestions - answeredCount} tersisa)`}
            </button>
          )}
        </div>

        {/* Mini progress per category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Progress Semua Bidang</p>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map((cat, idx) => {
              const answered = catAnsweredCount(idx);
              const done = answered === 8;
              const colors = COLOR_MAP[cat.color];
              return (
                <button key={cat.id} onClick={() => setActiveCategory(idx)} className="text-center group">
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-xl mb-1 transition-all ${
                    done ? `${colors.bg} shadow-md` : 'bg-gray-100 dark:bg-gray-700'
                  } ${activeCategory === idx ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
                    {cat.emoji}
                  </div>
                  <p className={`text-xs font-medium ${done ? colors.text : 'text-gray-400 dark:text-gray-500'}`}>
                    {answered}/8
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
          © 2025 SMP ABBS Surakarta — Asesmen Minat & Bakat
        </div>
      </main>
    </div>
  );
}