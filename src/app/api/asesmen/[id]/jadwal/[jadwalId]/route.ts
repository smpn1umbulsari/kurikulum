import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string; jadwalId: string }>;
}

// PUT /api/asesmen/[id]/jadwal/[jadwalId] - Update jadwal
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id, jadwalId } = await params;
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

    const { data, error } = await supabase
        .from('asesmen_jadwal')
        .update({
            hari: hari || null,
            tanggal: tanggal || null,
            jam: jam || null,
            jam_mulai: jam_mulai || null,
            durasi_menit: durasi_menit || 120,
            mata_pelajaran_id: mata_pelajaran_id || null,
            urutan: urutan || 1,
            updated_at: new Date().toISOString(),
        })
        .eq('id', jadwalId)
        .eq('asesmen_id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE /api/asesmen/[id]/jadwal/[jadwalId] - Delete jadwal
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id, jadwalId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
        .from('asesmen_jadwal')
        .delete()
        .eq('id', jadwalId)
        .eq('asesmen_id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}