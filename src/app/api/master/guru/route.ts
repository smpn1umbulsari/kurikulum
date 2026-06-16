import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/guru - List all guru with pagination
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = supabase
        .from('guru')
        .select(`
            *,
            pengguna:pengguna_id(id, nama, role, status)
        `, { count: 'exact' })
        .order('urutan', { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

    if (search) {
        query = query.or(`nama.ilike.%${search}%,kode_guru.ilike.%${search}%,nip.ilike.%${search}%`);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching guru:', error);
        return NextResponse.json(
            { error: 'Failed to fetch guru' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        data,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    });
}

// POST /api/master/guru - Create new guru
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { nama, nip, status_pegawai, pengguna_id, status } = body;

    // Auto-generate kode_guru if not provided
    let kode_guru = body.kode_guru;
    if (!kode_guru) {
        const { count } = await supabase
            .from('guru')
            .select('*', { count: 'exact', head: true });
        
        kode_guru = `GR-${String((count || 0) + 1).padStart(3, '0')}`;
    }

    // Get next urutan
    const { data: lastGuru } = await supabase
        .from('guru')
        .select('urutan')
        .not('urutan', 'is', null)
        .order('urutan', { ascending: false })
        .limit(1)
        .single();

    const urutan = lastGuru?.urutan ? lastGuru.urutan + 1 : 1;

    const { data, error } = await supabase
        .from('guru')
        .insert({
            nama,
            kode_guru,
            nip: status_pegawai === 'GTT' ? '-' : (nip || '-'),
            status_pegawai: status_pegawai || 'PNS',
            pengguna_id,
            status: status || 'aktif',
            urutan,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating guru:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    await logAudit(supabase, (auth as any).id || 'system', 'CREATE', 'guru', data.id, null, data);

    return NextResponse.json({ data }, { status: 201 });
}
