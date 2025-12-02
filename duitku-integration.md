# Integrasi Duitku Payment Gateway (Sandbox)

## Konfigurasi Awal

### 1. Dapatkan Kredensial dari Duitku
- Daftar akun di Duitku Sandbox: https://sandbox.duitku.com
- Dapatkan `Merchant Code` dan `API Key` dari dashboard merchant

### 2. Konfigurasi Environment Variables
Buat file `.env.local` di root direktori project dan tambahkan:

```env
DUITKU_MERCHANT_CODE=your_merchant_code_here
DUITKU_API_KEY=your_api_key_here
DUITKU_BASE_URL=https://sandbox.duitku.com
```

Ganti `your_merchant_code_here` dan `your_api_key_here` dengan kredensial sebenarnya dari akun sandbox Duitku Anda.

### 3. Kompatibilitas Mode Gelap
Komponen dan halaman pembayaran telah dirancang untuk kompatibel dengan mode gelap. Pastikan aplikasi Anda mendukung mode gelap menggunakan Tailwind CSS dengan konfigurasi class strategy:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // atau 'media' tergantung preferensi Anda
  // ... konfigurasi lainnya
}
```

## Struktur File

- `/lib/duitku.ts` - Konfigurasi dan kelas utama Duitku
- `/app/api/duitku/create-payment/route.ts` - API endpoint untuk membuat pembayaran
- `/app/api/duitku/notification/route.ts` - API endpoint untuk menerima notifikasi pembayaran
- `/app/api/duitku/payment-status/route.ts` - API endpoint untuk mengecek status pembayaran
- `/components/DuitkuPaymentButton.tsx` - Komponen frontend untuk tombol pembayaran
- `/app/payment/page.tsx` - Contoh halaman pembayaran

## Endpoint API

### 1. Membuat Pembayaran Baru
- **URL**: `/api/duitku/create-payment`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "merchantOrderId": "ORDER-12345",
  "amount": 10000,
  "productDetails": "Product Purchase",
  "additionalParam": "",
  "expiryPeriod": 60,
  "customerVaName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "081234567890"
}
```

### 2. Menerima Notifikasi Pembayaran
- **URL**: `/api/duitku/notification`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**: Dikirimkan otomatis oleh Duitku

### 3. Mengecek Status Pembayaran
- **URL**: `/api/duitku/payment-status`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "merchantOrderId": "ORDER-12345"
}
```

## Penggunaan Komponen

### DuitkuPaymentButton
Komponen ini menyediakan tombol pembayaran yang terintegrasi dengan Duitku:

```jsx
<DuitkuPaymentButton
  amount={10000}
  email="customer@example.com"
  phoneNumber="081234567890"
  customerName="John Doe"
  productDetails="Sample Product"
  onSuccess={(response) => console.log('Success:', response)}
  onError={(error) => console.log('Error:', error)}
/>
```

## Konfigurasi Webhook Notification

Untuk menerima notifikasi pembayaran secara otomatis:

1. Login ke dashboard Duitku Sandbox
2. Pergi ke pengaturan merchant
3. Set Notification URL ke: `https://[your-domain]/api/duitku/notification`

## Testing di Lingkungan Sandbox

1. Gunakan akun sandbox Duitku
2. Gunakan data uji yang tersedia di dokumentasi Duitku
3. Pastikan environment variables sudah diset dengan kredensial sandbox
4. Akses halaman `/payment` untuk mencoba pembayaran

## Penanganan Status Pembayaran

Duitku mengirimkan status pembayaran berikut:
- `00`: Pembayaran berhasil
- `01`: Pembayaran pending
- `02`: Pembayaran dibatalkan

## Security Notes

- Jangan pernah menyimpan API Key di kode frontend
- Selalu verifikasi signature dari notifikasi Duitku
- Gunakan HTTPS untuk produksi
- Pastikan endpoint notifikasi tidak dipublikasikan secara tidak sengaja

## Error Handling

Pastikan untuk menangani error berikut:
- Gagal membuat pembayaran
- Invalid signature di notifikasi
- Network error saat komunikasi dengan Duitku API
- Pembayaran timeout atau dibatalkan

## Production Deployment

Sebelum deploy ke production:
1. Ganti URL ke production Duitku: `https://passport.duitku.com`
2. Gunakan kredensial production Duitku
3. Pastikan webhook notification sudah diupdate
4. Lakukan testing pembayaran dengan uang sungguhan (dengan sangat hati-hati)