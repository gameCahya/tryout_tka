module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/fonnte.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/fonnte.ts
// Konfigurasi untuk integrasi Fonnte API
__turbopack_context__.s([
    "Fonnte",
    ()=>Fonnte
]);
class Fonnte {
    static API_URL = 'https://api.fonnte.com/send';
    static API_KEY = process.env.FONNTE_API_KEY;
    static async sendWA(options) {
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target: options.target,
                    message: options.message,
                    schedule: options.schedule,
                    country_code: options.country_code || '62',
                    device_id: options.device_id,
                    photo_url: options.photo_url,
                    document_url: options.document_url,
                    type: options.type
                })
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
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Terjadi kesalahan saat mengirim pesan WhatsApp'
            };
        }
    }
}
}),
"[project]/app/api/send-wa/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_$40$babel$2b$core$40$7$2e$28$2e$5_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.0_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$fonnte$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/fonnte.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const body = await request.json();
        const { phone, fullName, isNotification, registrationData } = body;
        let targetPhone = phone;
        if (isNotification) {
            // Jika ini notifikasi untuk admin, gunakan nomor dari environment variable
            const adminPhone = process.env.ADMIN_PHONE;
            if (!adminPhone) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_$40$babel$2b$core$40$7$2e$28$2e$5_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'ADMIN_PHONE tidak ditemukan di environment variables'
                }, {
                    status: 500
                });
            }
            targetPhone = adminPhone;
        } else if (!targetPhone) {
            // Jika bukan notifikasi dan tidak ada nomor yang ditentukan
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_$40$babel$2b$core$40$7$2e$28$2e$5_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Phone wajib diisi'
            }, {
                status: 400
            });
        }
        // Pastikan format nomor sesuai (62xxx tanpa +)
        let formattedPhone = targetPhone.replace(/\D/g, '');
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
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$fonnte$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Fonnte"].sendWA({
            target: formattedPhone,
            message: message,
            country_code: '62'
        });
        if (!result.success) {
            console.error('Fonnte API Error:', result.error, result.data);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_$40$babel$2b$core$40$7$2e$28$2e$5_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Gagal mengirim WhatsApp',
                details: result.error
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_$40$babel$2b$core$40$7$2e$28$2e$5_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'WhatsApp berhasil dikirim',
            data: result.data
        });
    } catch (error) {
        console.error('Error sending WA:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$0_$40$babel$2b$core$40$7$2e$28$2e$5_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__80de68ad._.js.map