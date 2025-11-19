'use client';
import { useState } from 'react';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: '📝',
      title: 'Berbagai Tipe Soal',
      description: 'Single choice, multiple choice (MCMA), dan reasoning (Benar/Salah)'
    },
    {
      icon: '⏱️',
      title: 'Timer Otomatis',
      description: 'Simulasi ujian real dengan countdown timer yang akurat'
    },
    {
      icon: '📊',
      title: 'Hasil Instan',
      description: 'Lihat skor dan pembahasan lengkap setelah selesai'
    },
    {
      icon: '📚',
      title: 'History Tryout',
      description: 'Track progress dan review jawaban kapan saja'
    },
    {
      icon: '🎯',
      title: 'Pembahasan Detail',
      description: 'Pahami setiap soal dengan penjelasan komprehensif'
    },
    {
      icon: '📱',
      title: 'Responsive Design',
      description: 'Akses dari desktop, tablet, atau smartphone'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmad Rizki',
      role: 'Mahasiswa Kedokteran',
      text: 'Platform ini sangat membantu persiapan UTBK saya. Soal-soalnya berkualitas!',
      avatar: '👨‍🎓'
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Guru SMA',
      text: 'Fitur reasoning dan MCMA sangat cocok untuk latihan soal HOTS siswa.',
      avatar: '👩‍🏫'
    },
    {
      name: 'Budi Santoso',
      role: 'Fresh Graduate',
      text: 'Berkat tryout ini, saya lolos CPNS. Pembahasan soalnya sangat detail!',
      avatar: '👨‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎓 Zona Edukasi
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Fitur</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">Cara Kerja</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition">Testimoni</a>
              <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">Login</a>
              <a href="/auth/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition">
                Daftar Gratis
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-blue-600">Fitur</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-blue-600">Cara Kerja</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-blue-600">Testimoni</a>
              <a href="/auth/login" className="block text-blue-600 font-medium">Login</a>
              <a href="/auth/register" className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-center">
                Daftar Gratis
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Persiapan Ujian
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Jadi Lebih Mudah
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Platform tryout online terlengkap dengan berbagai tipe soal, timer otomatis, dan pembahasan detail untuk persiapan UTBK, CPNS, dan ujian lainnya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition transform hover:-translate-y-1">
              🚀 Mulai Sekarang - GRATIS
            </a>
            <a href="#features" className="bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-blue-600 transition">
              Lihat Fitur
            </a>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            <div>
              <div className="text-3xl font-bold text-blue-600">1000+</div>
              <div className="text-gray-600 mt-1">Soal Berkualitas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">500+</div>
              <div className="text-gray-600 mt-1">Pengguna Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">95%</div>
              <div className="text-gray-600 mt-1">Tingkat Kepuasan</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-gray-600">Semua yang Anda butuhkan untuk persiapan ujian maksimal</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:shadow-xl transition transform hover:-translate-y-2">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Cara Kerja</h2>
            <p className="text-xl text-gray-600">3 Langkah mudah untuk memulai</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Daftar Akun</h3>
              <p className="text-gray-600">Buat akun gratis dalam hitungan detik</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Pilih Tryout</h3>
              <p className="text-gray-600">Pilih tryout sesuai kebutuhan Anda</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Mulai Latihan</h3>
              <p className="text-gray-600">Kerjakan soal dan lihat hasilnya</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Apa Kata Mereka</h2>
            <p className="text-xl text-gray-600">Cerita sukses dari pengguna TryoutPro</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                <div className="text-5xl mb-4">{testimonial.avatar}</div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">
            Siap Untuk Memulai?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabung dengan ribuan pengguna yang sudah merasakan manfaatnya
          </p>
          <a href="/auth/register" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition transform hover:-translate-y-1">
            Daftar Gratis Sekarang →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">🎓 TryoutPro</div>
              <p className="text-gray-400">Platform tryout online terbaik untuk persiapan ujianmu</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produk</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Tryout UTBK</a></li>
                <li><a href="#" className="hover:text-white">Tryout CPNS</a></li>
                <li><a href="#" className="hover:text-white">Tryout Sekolah</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white">Kontak</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 TryoutPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}