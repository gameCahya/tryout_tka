// app/api/send-wa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Fonnte } from '@/lib/fonnte';

interface RequestBody {
  phone?: string;
  fullName?: string;
  isNotification?: boolean;
  registrationData?: {
    fullName: string;
    phone: string;
    school: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    
    if (!body.isNotification) {
      // Send welcome message to user
      if (!body.phone || !body.fullName) {
        return NextResponse.json(
          { error: 'Phone and fullName are required' },
          { status: 400 }
        );
      }

      const message = `Halo ${body.fullName}! 🎉

Selamat datang di Zona Edukasi! 

Akun Anda telah berhasil dibuat. Sekarang Anda dapat:
✅ Mengakses tryout TKA
✅ Melihat riwayat hasil ujian
✅ Memantau perkembangan belajar

Jika ada pertanyaan, hubungi admin kami.

Salam sukses,
Tim Zona Edukasi`;

      const result = await Fonnte.sendWA({
        target: body.phone,
        message: message,
        country_code: '62'
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send WhatsApp' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'WhatsApp sent successfully',
        data: result.data
      });
    } else {
      // Send notification to admin
      if (!body.registrationData) {
        return NextResponse.json(
          { error: 'Registration data is required for notifications' },
          { status: 400 }
        );
      }

      const { fullName, phone, school } = body.registrationData;
      const adminPhone = process.env.ADMIN_PHONE_NUMBER;

      if (!adminPhone) {
        return NextResponse.json(
          { error: 'Admin phone number not configured' },
          { status: 500 }
        );
      }

      const message = `📋 *PENDAFTARAN BARU*

✅ *Nama*: ${fullName}
📱 *No. HP*: ${phone}
🏫 *Sekolah*: ${school}
⏰ *Waktu*: ${new Date().toLocaleString('id-ID')}

Segera verifikasi dan sambut user baru!`;

      const result = await Fonnte.sendWA({
        target: adminPhone,
        message: message,
        country_code: '62'
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send admin notification' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Admin notification sent successfully',
        data: result.data
      });
    }
  } catch (error: unknown) {
    console.error('Error in send-wa API:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}