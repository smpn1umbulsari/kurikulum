import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/asesmen/[id]/ruang - Get pengaturan & siswa ruang
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    // Get asesmen untuk acuan kelas
    const { data: asesmen } = await supabase
        .from('asesmen')
        .select('semester_id, acuan_kelas')
        .eq('id', id)
        .single();

    if (!asesmen) {
        return NextResponse.json({ error: 'Asesmen not found' }, { status: 404 });
    }

    // Get or create asesmen_ruang
    const { data: ruangData } = await supabase
        .from('asesmen_ruang')
        .select('*')
        .eq('asesmen_id', id)
        .single();

    // Default pengaturan
    const defaultPengaturan = {
        kapasitas_default: 24,
        mode_pembagian: '固定20',
        acuan_kelas: asesmen.acuan_kelas,
        pengaturan_7: { aktif: true, urutan: 'az', ruang_awal: 71, ruang_akhir: 75 },
        pengaturan_8: { aktif: true, urutan: 'az', ruang_awal: 81, ruang_akhir: 85 },
        pengaturan_9: { aktif: true, urutan: 'az', ruang_awal: 91, ruang_akhir: 95 },
    };

    const pengaturan = ruangData?.pengaturan || defaultPengaturan;

    // Get siswa ruang assignments
    const { data: siswaRuangs } = await supabase
        .from('asesmen_siswa_ruang')
        .select(`
            *,
            siswa:siswa_id (
                id,
                nis,
                nama,
                jenis_kelamin
            )
        `)
        .eq('asesmen_id', id)
        .order('nomor_ruang', { ascending: true })
        .order('nomor_urut', { ascending: true });

    // Transform data
    const transformedSiswaRuangs = siswaRuangs?.map((sr: Record<string, unknown>) => ({
        siswa_id: sr.siswa_id,
        siswa_nis: (sr.siswa as Record<string, unknown>)?.nis || '',
        siswa_nama: (sr.siswa as Record<string, unknown>)?.nama || '',
        kelas_nama: '', // Will be populated from another query
        jenjang: 7, // Will be determined from kelas
        nomor_ruang: sr.nomor_ruang,
        nomor_urut: sr.nomor_urut,
    })) || [];

    return NextResponse.json({
        pengaturan,
        siswa_ruangs: transformedSiswaRuangs,
    });
}

// PUT /api/asesmen/[id]/ruang - Save/update pengaturan ruang
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { pengaturan } = body;

    if (!pengaturan) {
        return NextResponse.json({ error: 'Pengaturan required' }, { status: 400 });
    }

    // Upsert asesmen_ruang
    const { data, error } = await supabase
        .from('asesmen_ruang')
        .upsert({
            asesmen_id: id,
            pengaturan: pengaturan,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}