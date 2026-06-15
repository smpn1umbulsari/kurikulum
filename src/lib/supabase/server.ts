import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase Client for Server Components & Server Actions
 * 
 * Digunakan di:
 * - Server Components (page.tsx, layout.tsx)
 * - Server Actions (actions.ts)
 * - API Routes (route.ts)
 * - Middleware
 * 
 * Menggunakan cookie session dari @supabase/ssr
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Handle cookie errors in read-only contexts
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Handle cookie errors in read-only contexts
                    }
                },
            },
        }
    );
}

/**
 * Admin client dengan service role key
 * HANYA digunakan di server-side untuk operasi yang memerlukan bypass RLS
 * JANGAN export ini ke client-side code
 */
export function createAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get() { return undefined; },
                set() { /* noop */ },
                remove() { /* noop */ },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}