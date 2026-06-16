import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/siswa - List all siswa with pagination
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // aktif, alumni, nonaktif
    const jenjang = searchParams.get('jenjang');
    const kelasId = searchParams.get('kelas_id');
    const offset = (page - 1) * limit;

    let query = supabase
        .from('siswa')
        .select(`
            *,
            pengguna:pengguna_id(id, nama, role, status)
        `, { count: 'exact' })
        .order('nama', { ascending: true })
        .range(offset, offset + limit - 1);

    if (search) {
        query = query.or(`nama.ilike.%${search}%,nis.ilike.%${search}%,nisn.ilike.%${search}%`);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching siswa:', error);
        return NextResponse.json(
            { error: 'Failed to fetch siswa' },
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

// POST /api/master/siswa - Create new siswa
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { nis, nisn, nipd, nama, jenis_kelamin, pengguna_id, status } = body;

    const { data, error } = await supabase
        .from('siswa')
        .insert({
            nis,
            nisn,
            nipd,
            nama,
            jenis_kelamin,
            pengguna_id,
            status: status || 'aktif',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating siswa:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    await logAudit(supabase, (auth as any).id || 'system', 'CREATE', 'siswa', data.id, null, data);

    return NextResponse.json({ data }, { status: 201 });
}
