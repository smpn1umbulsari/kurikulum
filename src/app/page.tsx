import { redirect } from 'next/navigation';

/**
 * Root Page
 * 
 * Halaman root yang akan redirect ke dashboard atau login
 * berdasarkan status authentication.
 */
export default function HomePage() {
    // Redirect ke dashboard (middleware akan handle jika belum login)
    redirect('/(protected)/dashboard');
}