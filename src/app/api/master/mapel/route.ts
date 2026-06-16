import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/mapel - List all mata pelajaran
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    let query = supabase
        .from('mata_pelajaran')
        .select('*', { count: 'exact' })
        .order('nama', { ascending: true });

    if (search) {
        query = query.or(`nama.ilike.%${search}%,kode_mapel.ilike.%${search}%`);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching mapel:', error);
        return NextResponse.json({ error: 'Failed to fetch mapel' }, { status: 500 });
    }

    return NextResponse.json({ data, count });
}

// POST /api/master/mapel - Create new mata pelajaran
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { kode_mapel, nama, kelompok, agama, status } = body;

    const { data, error } = await supabase
        .from('mata_pelajaran')
        .insert({
            kode_mapel,
            nama,
            kelompok,
            agama,
            status: status || 'aktif',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating mapel:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'CREATE', 'mata_pelajaran', data.id, null, data);

    return NextResponse.json({ data }, { status: 201 });
}
