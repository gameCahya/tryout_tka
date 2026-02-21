import { TryoutForm } from '../../types';

interface CreateTryoutModalProps {
  form: TryoutForm;
  saving: boolean;
  onChange: (form: TryoutForm) => void;
  onSave: () => void;
  onClose: () => void;
}

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export default function CreateTryoutModal({
  form,
  saving,
  onChange,
  onSave,
  onClose,
}: CreateTryoutModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Buat Tryout Baru</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Judul Tryout <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => onChange({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Contoh: Tryout Matematika Kelas 6"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={e => onChange({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Deskripsi singkat tryout ini..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Durasi (menit)
            </label>
            <div className="flex gap-2 mb-2">
              {DURATION_PRESETS.map(m => (
                <button
                  key={m}
                  onClick={() => onChange({ ...form, duration_minutes: m })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.duration_minutes === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5}
              max={300}
              value={form.duration_minutes}
              onChange={e => onChange({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-linear-to-r from-blue-600 to-green-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Menyimpan...' : 'Buat Tryout'}
          </button>
        </div>
      </div>
    </div>
  );
}
