import React from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  imagePreview: string | null;
  uploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export default function ImageUploader({
  imagePreview,
  uploadingImage,
  fileInputRef,
  onFileChange,
  onRemove,
}: ImageUploaderProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        Gambar Soal{' '}
        <span className="text-gray-400 font-normal">(opsional)</span>
      </label>

      {imagePreview ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <Image
              src={imagePreview}
              alt="Preview gambar soal"
              width={400}
              height={200}
              unoptimized
              className="rounded-xl border border-gray-200 dark:border-gray-600 object-contain"
              style={{ maxHeight: '200px', maxWidth: '100%', width: 'auto', height: 'auto' }}
            />
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-md"
              title="Hapus gambar"
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline block"
          >
            Ganti gambar
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
        >
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Klik untuk upload gambar
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            JPG, PNG, GIF — Maks. 2MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {uploadingImage && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Mengupload gambar...
        </p>
      )}
    </div>
  );
}