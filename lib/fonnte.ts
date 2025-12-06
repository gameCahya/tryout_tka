// lib/fonnte.ts
// Konfigurasi untuk integrasi Fonnte API

interface SendWAOptions {
  target: string;
  message: string;
  schedule?: string; // format: 'YYYY-MM-DD HH:mm:ss'
  country_code?: string;
  device_id?: string;
  photo_url?: string;
  document_url?: string;
  type?: 'chat' | 'image' | 'document';
}

export class Fonnte {
  private static readonly API_URL = 'https://api.fonnte.com/send';
  private static readonly API_KEY = process.env.FONNTE_API_KEY;

  static async sendWA(options: SendWAOptions): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.API_KEY) {
      return {
        success: false,
        error: 'FONNTE_API_KEY tidak ditemukan di environment variables'
      };
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': this.API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: options.target,
          message: options.message,
          schedule: options.schedule,
          country_code: options.country_code || '62',
          device_id: options.device_id,
          photo_url: options.photo_url,
          document_url: options.document_url,
          type: options.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Gagal mengirim pesan WhatsApp',
          data
        };
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Terjadi kesalahan saat mengirim pesan WhatsApp'
      };
    }
  }
}