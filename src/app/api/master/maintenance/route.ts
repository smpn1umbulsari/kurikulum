import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

// GET /api/master/maintenance - Get maintenance config
// NOTE: This endpoint is accessible to all authenticated users
// because the middleware needs to check maintenance status for every request.
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const { data: config } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

    const defaultConfig = {
        enabled: false,
        message: 'Sistem sedang dalam pemeliharaan. Mohon tunggu beberapa saat.',
        allowed_roles: ['superadmin', 'admin'],
    };

    return NextResponse.json({
        config: config?.value || defaultConfig,
    });
}

// PUT /api/master/maintenance - Update maintenance config
export async function PUT(request: NextRequest) {
    // SEC-01 FIX: Only superadmin can toggle maintenance mode
    const auth = await authorize(['superadmin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const supabase = await createClient();
    const body = await request.json();

    const config = {
        enabled: body.enabled ?? false,
        message: body.message || 'Sistem sedang dalam pemeliharaan.',
        allowed_roles: body.allowed_roles || ['superadmin', 'admin'],
        scheduled_until: body.scheduled_until || null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
    };

    // Upsert config
    const { error } = await supabase
        .from('app_settings')
        .upsert({
            key: 'maintenance_mode',
            value: config,
        }, { onConflict: 'key' });

    if (error) {
        console.error('Error updating maintenance config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config });
}