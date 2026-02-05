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