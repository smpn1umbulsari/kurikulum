import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/asesmen/[id] - Get single asesmen
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('asesmen')
        .select(`
            *,
            semester:semester_id (
                id,
                nama,
                tahun_pelajaran:tahun_pelajaran_id (nama)
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Transform data
    const transformedData = {
        ...data,
        semester_nama: data.semester?.nama,
        tahun_pelajaran_nama: data.semester?.tahun_pelajaran?.nama,
    };

    return NextResponse.json(transformedData);
}

// PUT /api/asesmen/[id] - Update asesmen
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
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
        .update({
            semester_id,
            jenis_ujian,
            tanggal_mulai: tanggal_mulai || null,
            tanggal_selesai: tanggal_selesai || null,
            tanggal_ttd: tanggal_ttd || null,
            kode_nus: kode_nus || null,
            acuan_kelas: acuan_kelas || 'real',
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE /api/asesmen/[id] - Delete asesmen
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
        .from('asesmen')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}