import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, fullName } = await request.json();

    if (!phone || !fullName) {
      return NextResponse.json(
        { error: 'Phone dan fullName wajib diisi' },
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

    // Pesan yang akan dikirim
    const message = `Halo ${fullName}! 👋

Selamat datang di platform Try Out kami! 🎓

Terima kasih telah mendaftar. Akun Anda telah berhasil dibuat dan siap digunakan.

Silakan login untuk mulai mengikuti try out dan meningkatkan kemampuan Anda.

Semangat belajar! 💪`;

    // Kirim ke Fonnte API
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_API_KEY || '', // Simpan API key di .env
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: '62', // Kode negara Indonesia
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Fonnte API Error:', data);
      return NextResponse.json(
        { error: 'Gagal mengirim WhatsApp', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp berhasil dikirim',
      data 
    });

  } catch (error: any) {
    console.error('Error sending WA:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}