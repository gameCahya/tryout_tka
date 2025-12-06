import { NextRequest, NextResponse } from 'next/server';
import { Fonnte } from '@/lib/fonnte';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, fullName, isNotification, registrationData } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone wajib diisi' },
        { status: 400 }
      );
    }

    // Pastikan format nomor sesuai (62xxx tanpa +)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    let message = '';
    
    if (isNotification && registrationData) {
      // Pesan notifikasi untuk admin
      const { fullName: registrantName, phone: registrantPhone, school: registrantSchool } = registrationData;
      message = `🔔 NOTIFIKASI PENDAFTARAN BARU 🔔

Nama: ${registrantName}
Nomor HP: ${registrantPhone}
Asal Sekolah: ${registrantSchool}

Seseorang telah mendaftar di platform Anda!`;
    } else {
      // Pesan selamat datang untuk user
      message = `Halo ${fullName}! 👋

Selamat datang di platform Try Out kami! 🎓

Terima kasih telah mendaftar. Akun Anda telah berhasil dibuat dan siap digunakan.

Silakan login untuk mulai mengikuti try out dan meningkatkan kemampuan Anda.

Semangat belajar! 💪`;
    }

    // Kirim ke Fonnte API menggunakan kelas Fonnte
    const result = await Fonnte.sendWA({
      target: formattedPhone,
      message: message,
      country_code: '62',
    });

    if (!result.success) {
      console.error('Fonnte API Error:', result.error, result.data);
      return NextResponse.json(
        { error: 'Gagal mengirim WhatsApp', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp berhasil dikirim',
      data: result.data 
    });

  } catch (error: any) {
    console.error('Error sending WA:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}