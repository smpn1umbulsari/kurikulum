import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';

/**
 * Configure Inter font
 * Inter adalah font sans-serif yang modern dan mudah dibaca
 */
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

/**
 * Metadata untuk aplikasi
 */
export const metadata: Metadata = {
    title: {
        default: 'Guru Spenturi v2',
        template: '%s | Guru Spenturi v2',
    },
    description: 'Aplikasi administrasi kurikulum sekolah SMP Negeri 1 Spenturi',
    keywords: ['kurikulum', 'sekolah', 'nilai', 'rapor', 'asesmen', 'manajemen'],
    authors: [{ name: 'SMP Negeri 1 Spenturi' }],
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    icons: {
        icon: '/favicon.ico',
    },
};

/**
 * Root Layout
 * 
 * Layout utama yang membungkus seluruh aplikasi.
 * AuthProvider dan Toaster harus ada di sini agar tersedia di seluruh halaman.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" className={inter.variable}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <AuthProvider>
                    {children}
                </AuthProvider>
                <Toaster />
            </body>
        </html>
    );
}