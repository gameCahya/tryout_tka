'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/types/tryout';
import { UserAnswer } from '@/types/review';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

type ReviewQuestionCardProps = {
  question: Question;
  userAnswer?: UserAnswer;
  questionNumber: number;
  hasPaid: boolean;
  onUnlockClick: () => void;
};

export default function ReviewQuestionCard({
  question,
  userAnswer,
  questionNumber,
  hasPaid,
  onUnlockClick,
}: ReviewQuestionCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'approved'>('none');

  // Fetch payment status
  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data } = await supabase
      .from('manual_payments')
      .select('status')
      .eq('user_id', session.user.id)
      .eq('tryout_id', question.tryout_id)
      .single();
    
    if (data) {
      setPaymentStatus(data.status === 'approved' ? 'approved' : 'pending');
    }
  };

  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const renderQuestionText = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({node, ...props}) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => (
            <thead className="bg-gray-100 dark:bg-gray-700" {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium dark:text-white" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-gray-200" {...props} />
          ),
          img: ({node, src, alt, ...props}) => {
            const imageUrl = getImageUrl(typeof src === 'string' ? src : '');
            if (!imageUrl) return null;
            return (
              <img
                src={imageUrl}
                alt={alt || 'Soal'}
                className="max-w-full h-auto my-3 rounded border dark:border-gray-600"
                {...props}
              />
            );
          },
          p: ({node, ...props}) => (
            <p className="text-gray-800 dark:text-gray-200 mb-2" {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  const isMultiple = question.question_type === 'multiple';
  const isReasoning = question.question_type === 'reasoning';
  const correctAnswers = isMultiple 
    ? (question.correct_answers || []) 
    : [question.correct_answer_index];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
      {/* Status Badge */}
      <div className="mb-4 flex flex-wrap gap-2">
        {userAnswer?.is_correct ? (
          <div className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Jawaban Benar
          </div>
        ) : (
          <div className="inline-flex items-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
            ✗ Jawaban Salah
          </div>
        )}
        {isMultiple && (
          <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
            📋 PGK MCMA
          </div>
        )}
        {isReasoning && (
          <div className="inline-flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
            ⚖️ PGK Kategori
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          Soal {questionNumber}
        </h3>
        {question.image_url && (
          <img
            src={getImageUrl(question.image_url) || ''}
            alt="Soal"
            className="max-w-full h-auto mb-4 rounded border dark:border-gray-600"
          />
        )}
        <div className="text-gray-800 dark:text-gray-200">
          {renderQuestionText(question.question_text)}
        </div>
      </div>

      {/* Answer Section */}
      {isReasoning ? (
        <ReviewReasoningAnswers
          question={question}
          userAnswer={userAnswer}
        />
      ) : (
        <ReviewChoiceAnswers
          question={question}
          userAnswer={userAnswer}
          correctAnswers={correctAnswers}
          isMultiple={isMultiple}
        />
      )}

      {/* Explanation */}
      <div className="border-t dark:border-gray-600 pt-6 mt-6">
        <h4 className="font-semibold text-lg mb-3 flex items-center text-gray-800 dark:text-white">
          💡 Pembahasan
        </h4>
        {hasPaid || paymentStatus === 'approved' ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-gray-800 dark:text-gray-200">
              {question.explanation || 'Pembahasan belum tersedia untuk soal ini.'}
            </p>
          </div>
        ) : paymentStatus === 'pending' ? (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded border-2 border-yellow-300 dark:border-yellow-700 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Menunggu Konfirmasi
            </h5>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Bukti pembayaran Anda sedang diverifikasi oleh admin.
              Biasanya memakan waktu 1x24 jam.
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h5 className="font-semibold text-gray-800 dark:text-white mb-2">
              Pembahasan Terkunci
            </h5>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Dapatkan akses pembahasan lengkap dengan Rp 15.000 saja!
            </p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium"
            >
              💳 Upload Bukti Pembayaran
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && question.tryout_id && (
        <PaymentProofUpload
          tryoutId={question.tryout_id}
          onSuccess={() => {
            setShowPaymentModal(false);
            checkPaymentStatus();
          }}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

// Helper component for choice answers
function ReviewChoiceAnswers({
  question,
  userAnswer,
  correctAnswers,
  isMultiple,
}: {
  question: Question;
  userAnswer?: UserAnswer;
  correctAnswers: number[];
  isMultiple: boolean;
}) {
  return (
    <div className="space-y-2 mb-6">
      {question.options.map((option, idx) => {
        const isUserAnswer = isMultiple
          ? userAnswer?.user_answers.includes(idx)
          : userAnswer?.user_answer === idx;
        const isCorrectAnswer = correctAnswers.includes(idx);

        let borderColor = 'border-gray-300 dark:border-gray-600';
        let bgColor = 'bg-white dark:bg-gray-800';
        let iconColor = '';
        let icon = null;

        if (isCorrectAnswer) {
          borderColor = 'border-green-500 dark:border-green-600';
          bgColor = 'bg-green-50 dark:bg-green-900/20';
          iconColor = 'text-green-600 dark:text-green-400';
          icon = '✓';
        } else if (isUserAnswer) {
          borderColor = 'border-red-500 dark:border-red-600';
          bgColor = 'bg-red-50 dark:bg-red-900/20';
          iconColor = 'text-red-600 dark:text-red-400';
          icon = '✗';
        }

        return (
          <div
            key={idx}
            className={`p-3 rounded border-2 ${borderColor} ${bgColor}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {icon && (
                  <span className={`${iconColor} font-bold text-lg`}>{icon}</span>
                )}
              </div>
              <div className="flex-1 text-gray-800 dark:text-gray-200">
                <strong className="text-gray-900 dark:text-white">
                  {String.fromCharCode(65 + idx)}.
                </strong>{' '}
                {option}
                {isCorrectAnswer && (
                  <span className="ml-2 text-green-600 dark:text-green-400 text-sm font-medium">
                    (Jawaban Benar)
                  </span>
                )}
                {!isCorrectAnswer && isUserAnswer && (
                  <span className="ml-2 text-red-600 dark:text-red-400 text-sm font-medium">
                    (Jawaban Anda)
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper component for reasoning answers
function ReviewReasoningAnswers({
  question,
  userAnswer,
}: {
  question: Question;
  userAnswer?: UserAnswer;
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-gray-800 dark:text-white">#</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-gray-800 dark:text-white">Pernyataan</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-32 text-gray-800 dark:text-white">Jawaban Anda</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-32 text-gray-800 dark:text-white">Jawaban Benar</th>
            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center w-20 text-gray-800 dark:text-white">Status</th>
          </tr>
        </thead>
        <tbody>
          {question.options.map((option, idx) => {
            const userAns = userAnswer?.user_reasoning?.[idx];
            const correctAns = question.reasoning_answers?.[idx];
            const isCorrect = userAns === correctAns;
            
            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                <td className="border border-gray-300 dark:border-gray-600 p-3 font-bold text-gray-800 dark:text-white">
                  {String.fromCharCode(65 + idx)}.
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">
                  {option}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    userAns === 'benar' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                    userAns === 'salah' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {userAns === 'benar' ? 'Benar' : userAns === 'salah' ? 'Salah' : '-'}
                  </span>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    correctAns === 'benar' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {correctAns === 'benar' ? 'Benar' : 'Salah'}
                  </span>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  {isCorrect ? (
                    <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Payment Proof Upload Component
function PaymentProofUpload({
  tryoutId,
  onSuccess,
  onCancel,
}: {
  tryoutId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Silakan pilih file terlebih dahulu');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Anda harus login terlebih dahulu');
        setUploading(false);
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}_${tryoutId}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      console.log('Attempting to insert payment record...', {
        user_id: session.user.id,
        tryout_id: tryoutId,
        payment_proof_url: urlData.publicUrl,
      });

      // Insert payment record
      const { data: insertData, error: insertError } = await supabase
        .from('manual_payments')
        .insert({
          user_id: session.user.id,
          tryout_id: tryoutId,
          payment_proof_url: urlData.publicUrl,
          amount: 15000,
          payment_date: new Date().toISOString(),
          status: 'pending',
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Payment record inserted successfully:', insertData);

      // Success
      onSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengupload bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Upload Bukti Pembayaran
        </h3>

        <div className="mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Informasi Pembayaran
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p><strong>Bank:</strong> BCA</p>
              <p><strong>No. Rekening:</strong> 1234567890</p>
              <p><strong>Atas Nama:</strong> TKA Tryout</p>
              <p><strong>Jumlah:</strong> Rp 15.000</p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Silakan transfer ke rekening di atas dan upload bukti transfer Anda. 
            Admin akan memverifikasi dalam 1x24 jam.
          </p>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bukti Transfer
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/30 dark:file:text-blue-400
              dark:hover:file:bg-blue-900/50
              cursor-pointer"
            disabled={uploading}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            disabled={uploading}
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading || !file}
          >
            {uploading ? 'Mengupload...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}