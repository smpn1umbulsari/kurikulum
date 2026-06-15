import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

// GET /api/asesmen - List all asesmen
export async function GET(request: NextRequest) {
    // SEC-01 FIX: Allow read access for admin, superadmin, urusan, guru
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const semesterId = searchParams.get('semester_id');

    const supabase = await createClient();

    let query = supabase
        .from('asesmen')
        .select(`
            *,
            semester:semester_id (
                id,
                nama,
                tahun_pelajaran:tahun_pelajaran_id (nama)
            )
        `)
        .order('tanggal_mulai', { ascending: false });

    if (semesterId) {
        query = query.eq('semester_id', semesterId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include semester_nama
    const transformedData = data?.map((item) => ({
        ...item,
        semester_nama: item.semester?.nama,
        tahun_pelajaran_nama: item.semester?.tahun_pelajaran?.nama,
    }));

    return NextResponse.json(transformedData || []);
}

// POST /api/asesmen - Create new asesmen
export async function POST(request: NextRequest) {
    // SEC-01 FIX: Only admin, superadmin, urusan can create asesmen
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const {
        semester_id,
        jenis_ujian,
        tanggal_mulai,
        tanggal_selesai,
        tanggal_ttd,
        kode_nus,
        acuan_kelas,
    } = body;

    // Validate required fields
    if (!semester_id || !jenis_ujian) {
        return NextResponse.json(
            { error: 'Semester dan jenis ujian wajib diisi' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('asesmen')
        .insert({
            semester_id,
            jenis_ujian,
            tanggal_mulai: tanggal_mulai || null,
            tanggal_selesai: tanggal_selesai || null,
            tanggal_ttd: tanggal_ttd || null,
            kode_nus: kode_nus || null,
            acuan_kelas: acuan_kelas || 'real',
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}