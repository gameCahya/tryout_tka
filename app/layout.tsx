// ============================================
// FILE: app/layout.tsx
// ============================================
import { ThemeProvider } from '@/components/ThemeProvider';
import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css'

export const metadata: Metadata = {
  title: 'Tryout TKA',
  description: 'Platform Tryout Online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}