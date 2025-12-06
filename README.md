# 📚 Dokumentasi Lengkap - 3 Tipe Soal

Sistem tryout sekarang mendukung **3 tipe soal berbeda**:

## 1️⃣ Single Answer (Radio Button)
**Contoh:** Pilih satu jawaban yang paling tepat
- User memilih **1 jawaban** dari A/B/C/D
- Tampilan: Radio button
- Scoring: Benar jika pilihan = jawaban yang benar

## 2️⃣ Multiple Answer - PGK MCMA (Checkbox)
**Contoh:** Pilih semua jawaban yang benar (bisa lebih dari 1)
- User memilih **beberapa jawaban** (A, C, D)
- Tampilan: Checkbox
- Scoring: Benar jika **SEMUA** pilihan cocok dengan jawaban benar

## 3️⃣ PGK Kategori - Statement Reasoning (Benar/Salah)
**Contoh:** Tentukan Benar atau Salah untuk setiap pernyataan

| # | Pernyataan | Benar | Salah |
|---|------------|-------|-------|
| A | Besar sudut D adalah 50° | ○ | ● |
| B | Sudut C dapat ditentukan | ● | ○ |
| C | Sudut B dan E sama besar | ● | ○ |

- User menentukan **Benar/Salah** untuk **setiap pernyataan**
- Tampilan: Tabel dengan radio button Benar/Salah
- Scoring: Benar jika **SEMUA** pernyataan dijawab benar

---

## 🎯 Cara Menggunakan di Admin Panel

### Step 1: Pilih Tipe Soal
```
Tipe Soal: [Dropdown]
- Single Answer (Radio)
- Multiple Answer - PGK MCMA (Checkbox)
- PGK Kategori - Benar/Salah ✓
```

### Step 2: Isi Pilihan Jawaban
Masukkan pernyataan di setiap opsi A, B, C, D

### Step 3: Tentukan Jawaban Benar

**Untuk Single Answer:**
- Pilih 1 dari dropdown (A/B/C/D)

**Untuk MCMA:**
- Check semua yang benar (misal: A, C, D)

**Untuk Reasoning:**
- Klik Benar/Salah untuk setiap pernyataan

| # | Pernyataan | Benar | Salah |
|---|------------|-------|-------|
| A | ... | ● | ○ |
| B | ... | ○ | ● |
| C | ... | ● | ○ |

### Step 4: Submit
Soal akan tersimpan dengan format yang benar!

---

## 💾 Format Database

### Single Answer
```json
{
  "question_type": "single",
  "correct_answer_index": 2
}
```

### Multiple Answer
```json
{
  "question_type": "multiple",
  "correct_answer_index": -1,
  "correct_answers": [0, 2, 3]
}
```

### Reasoning
```json
{
  "question_type": "reasoning",
  "correct_answer_index": -1,
  "reasoning_answers": {
    "0": "salah",
    "1": "benar",
    "2": "benar"
  }
}
```

---

## 🎨 Tampilan untuk User

### Di Halaman Tryout:

**Single:** Radio button biasa
```
○ A. Jawaban 1
● B. Jawaban 2
○ C. Jawaban 3
```

**MCMA:** Checkbox dengan badge "PGK MCMA"
```
📋 PGK MCMA - Pilih lebih dari satu jawaban

☑ A. Jawaban 1
☐ B. Jawaban 2
☑ C. Jawaban 3
```

**Reasoning:** Tabel dengan badge "PGK Kategori"
```
⚖️ PGK Kategori - Tentukan Benar/Salah

| # | Pernyataan     | Benar | Salah |
|---|----------------|-------|-------|
| A | Pernyataan 1   |   ○   |   ●   |
| B | Pernyataan 2   |   ●   |   ○   |
```

### Di Halaman Review:

Menampilkan:
- ✓ Jawaban Benar (hijau)
- ✗ Jawaban Salah (merah)
- Perbandingan jawaban user vs jawaban benar

---

## 📲 Notifikasi WhatsApp Otomatis

Sistem ini dilengkapi dengan fitur notifikasi WhatsApp otomatis:

### Pendaftaran User
- Saat user mendaftar di `/auth/register`, sistem akan:
  1. Mengirim pesan selamat datang ke user yang mendaftar
  2. Mengirim notifikasi pendaftaran baru ke admin

### Konfigurasi
- `FONNTE_API_KEY`: API key dari Fonnte untuk mengirim WhatsApp
- `ADMIN_PHONE`: Nomor WhatsApp admin untuk menerima notifikasi pendaftaran

### Endpoint API
- `/api/send-wa`: Endpoint untuk mengirim pesan WhatsApp melalui Fonnte API
- Mendukung dua jenis pesan: selamat datang (untuk user) dan notifikasi (untuk admin)

---

## 📊 Scoring Logic

```javascript
// Single Answer
if (userAnswer === correctAnswer) score++;

// MCMA
if (
  userAnswers.length === correctAnswers.length &&
  userAnswers.every(ans => correctAnswers.includes(ans))
) score++;

// Reasoning
let allCorrect = true;
for (let i = 0; i < options.length; i++) {
  if (userReasoning[i] !== correctReasoning[i]) {
    allCorrect = false;
    break;
  }
}
if (allCorrect) score++;
```

---

## ✅ Checklist Implementasi

- [x] Admin page - form input
- [x] Database migration
- [x] Tryout page - display soal
- [x] Tryout page - save jawaban
- [x] Scoring logic
- [x] Review page - display hasil
- [x] Validasi form
- [x] Styling & UX
- [x] WhatsApp notifications

---

## 🚀 Next Steps

Sekarang sistem sudah lengkap untuk 3 tipe soal! Tinggal:
1. Run SQL migration di Supabase
2. Test buat soal di admin panel
3. Test kerjakan tryout
4. Test lihat review

**Semua sudah siap digunakan!** 🎉