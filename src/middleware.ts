import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Middleware
 * 
 * Dijalankan sebelum setiap request ke server.
 * Bertugas untuk:
 * 1. Memvalidasi sesi pengguna
 * 2. Redirect ke halaman login jika belum authenticated
 * 3. Redirect ke dashboard jika sudah login tapi mengakses halaman auth
 * 4. Handle maintenance mode
 */
export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

// Configure which routes should be processed by this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * API routes are now included for session cookie refresh.
         * Role-based authorization is handled by authorize() in each route.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};