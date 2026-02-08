// lib/phoneUtils.ts
/**
 * Membersihkan dan menormalisasi nomor HP ke format Indonesia (08xx)
 * @param input - Nomor HP input
 * @returns Nomor HP yang sudah dibersihkan
 */
export function cleanPhone(input: string): string {
  // Hapus semua karakter non-digit
  const num = input.replace(/\D/g, '');
  
  // Jika dimulai dengan 0, return langsung
  if (num.startsWith('0')) {
    return num;
  } 
  // Jika dimulai dengan 62 (kode negara Indonesia), ganti dengan 0
  else if (num.startsWith('62')) {
    return '0' + num.substring(2);
  } 
  // Jika panjangnya 11 dan dimulai dengan 8, tambahkan 0 di depan
  else if (num.length === 11 && num.startsWith('8')) {
    return '0' + num;
  }
  
  return num;
}

/**
 * Konversi nomor HP ke format email palsu untuk Supabase
 * @param phone - Nomor HP yang sudah dibersihkan
 * @returns Email palsu dalam format phone@tryout.id
 */
export function phoneToEmail(phone: string): string {
  return `${phone}@tryout.id`;
}

/**
 * Validate Indonesian phone number format
 */
export function validateIndonesianPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  return /^08[1-9][0-9]{7,11}$/.test(cleaned);
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = cleanPhone(phone);
  if (cleaned.length >= 10) {
    return cleaned.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
  }
  return cleaned;
}