import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/asesmen/[id]/jadwal - List jadwal for an asesmen
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('asesmen_jadwal')
        .select(`
            *,
            mata_pelajaran:mata_pelajaran_id (
                id,
                kode_mapel,
                nama
            )
        `)
        .eq('asesmen_id', id)
        .order('urutan', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const transformedData = data?.map((item) => ({
        ...item,
        mata_pelajaran_nama: item.mata_pelajaran?.nama
            ? `${item.mata_pelajaran?.kode_mapel} - ${item.mata_pelajaran?.nama}`
            : null,
    }));

    return NextResponse.json(transformedData || []);
}

// POST /api/asesmen/[id]/jadwal - Create new jadwal
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const {
        hari,
        tanggal,
        jam,
        jam_mulai,
        durasi_menit,
        mata_pelajaran_id,
        urutan,
    } = body;

    // Validate max 12 jadwal
    const { count } = await supabase
        .from('asesmen_jadwal')
        .select('*', { count: 'exact', head: true })
        .eq('asesmen_id', id);

    if (count && count >= 12) {
        return NextResponse.json(
            { error: 'Maksimal 12 jadwal ujian' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('asesmen_jadwal')
        .insert({
            asesmen_id: id,
            hari: hari || null,
            tanggal: tanggal || null,
            jam: jam || null,
            jam_mulai: jam_mulai || null,
            durasi_menit: durasi_menit || 120,
            mata_pelajaran_id: mata_pelajaran_id || null,
            urutan: urutan || 1,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}