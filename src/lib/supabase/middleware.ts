import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase Client untuk Middleware
 * 
 * Middleware berjalan di edge runtime, jadi kita perlu menangani cookie
 * dengan cara yang sedikit berbeda dari Server Components biasa.
 */
export async function updateSession(request: NextRequest) {
    // Create response object that will be modified
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Only run for protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/(protected)');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/(auth)');
    const isMaintenanceRoute = request.nextUrl.pathname.startsWith('/maintenance');

    if (!isProtectedRoute && !isAuthRoute) {
        return response;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                // If the cookie is being set, update the request and response
                request.cookies.set({
                    name,
                    value,
                    ...options,
                });
                response = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                });
                response.cookies.set({
                    name,
                    value,
                    ...options,
                });
            },
            remove(name: string, options: CookieOptions) {
                request.cookies.set({
                    name,
                    value: '',
                    ...options,
                });
                response = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                });
                response.cookies.set({
                    name,
                    value: '',
                    ...options,
                });
            },
        },
    });

    // Get current user session
    let user = null;
    if (process.env.MOCK_AUTH === 'true') {
        user = {
            id: 'mock-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@example.com',
            app_metadata: { provider: 'email' },
            user_metadata: { role: 'superadmin' },
            created_at: '2026-06-14T00:00:00Z'
        };
    } else {
        try {
            const { data } = await supabase.auth.getUser();
            user = data?.user || null;
        } catch (e) {
            console.error('Error getting user session:', e);
        }
    }

    // Auth routes: redirect to dashboard if already logged in
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/(protected)/dashboard', request.url));
    }

    // Protected routes: redirect to login if not authenticated
    if (isProtectedRoute && !user && !isMaintenanceRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/(auth)/login';
        return NextResponse.redirect(url);
    }

    return response;
}