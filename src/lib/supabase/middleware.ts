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

    // Support both literal route group paths and standard clean paths
    const isAuthRoute = 
        request.nextUrl.pathname.startsWith('/(auth)') || 
        request.nextUrl.pathname.startsWith('/login') || 
        request.nextUrl.pathname.startsWith('/logout');
        
    const isMaintenanceRoute = request.nextUrl.pathname.startsWith('/maintenance');
    
    const isStaticAsset = 
        request.nextUrl.pathname.startsWith('/_next') || 
        request.nextUrl.pathname.startsWith('/static') || 
        request.nextUrl.pathname.includes('.') || 
        request.nextUrl.pathname === '/favicon.ico';
        
    // Protected routes are anything that's not auth, maintenance, static, or root
    // Routes like /dashboard, /master/*, /nilai/* are protected
    const isProtectedRoute = 
        request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/master') || 
        request.nextUrl.pathname.startsWith('/nilai') || 
        request.nextUrl.pathname.startsWith('/rapor') || 
        request.nextUrl.pathname.startsWith('/settings') || 
        (!isAuthRoute && !isMaintenanceRoute && !isStaticAsset && !request.nextUrl.pathname.startsWith('/api') && request.nextUrl.pathname !== '/' && request.nextUrl.pathname !== '');

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
            id: '00000000-0000-0000-0000-000000000000',
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
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protected routes: redirect to login if not authenticated
    if (isProtectedRoute && !user && !isMaintenanceRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return response;
}
