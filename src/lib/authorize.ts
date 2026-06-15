import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Role-based authorization helper for API routes.
 * 
 * Validates the user's session and checks their role from the `pengguna` table.
 * Returns user/role data on success, or a NextResponse error (401/403) on failure.
 * 
 * @param allowedRoles - Array of role strings that are permitted to access the route.
 *                       Pass `['*']` to allow any authenticated user regardless of role.
 * @returns `{ user, pengguna }` on success, or `NextResponse` with 401/403 status on failure.
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *     const auth = await authorize(['admin', 'superadmin']);
 *     if (auth instanceof NextResponse) return auth; // 401 or 403
 *     const { user, pengguna } = auth;
 *     // ... proceed with authorized logic
 * }
 * ```
 */
export async function authorize(
    allowedRoles: string[]
): Promise<{ user: any; pengguna: any } | NextResponse> {
    // Support MOCK_AUTH for development/testing
    if (process.env.MOCK_AUTH === 'true') {
        const mockUser = {
            id: 'mock-user-id',
            email: 'admin@example.com',
        };
        const mockPengguna = {
            id: 'mock-user-id',
            username: 'admin',
            nama: 'Administrator',
            role: 'superadmin',
            status: 'aktif',
        };
        // In mock mode, always authorize (superadmin)
        if (allowedRoles.includes('*') || allowedRoles.includes(mockPengguna.role)) {
            return { user: mockUser, pengguna: mockPengguna };
        }
        return NextResponse.json(
            { error: 'Forbidden: insufficient role' },
            { status: 403 }
        );
    }

    const supabase = await createClient();

    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: 'Unauthorized: authentication required' },
            { status: 401 }
        );
    }

    // 2. Allow any authenticated user if wildcard is used
    if (allowedRoles.includes('*')) {
        return { user, pengguna: { id: user.id, role: 'authenticated' } };
    }

    // 3. Lookup role from pengguna table
    const { data: pengguna, error: penggunaError } = await supabase
        .from('pengguna')
        .select('id, username, nama, role, status')
        .eq('id', user.id)
        .single();

    if (penggunaError || !pengguna) {
        return NextResponse.json(
            { error: 'Forbidden: user profile not found' },
            { status: 403 }
        );
    }

    // 4. Check if user's status is aktif
    if (pengguna.status !== 'aktif') {
        return NextResponse.json(
            { error: 'Forbidden: account is inactive' },
            { status: 403 }
        );
    }

    // 5. Check role
    if (!allowedRoles.includes(pengguna.role)) {
        return NextResponse.json(
            { error: 'Forbidden: insufficient role' },
            { status: 403 }
        );
    }

    return { user, pengguna };
}
