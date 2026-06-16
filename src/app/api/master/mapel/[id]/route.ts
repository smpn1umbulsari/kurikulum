import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// GET /api/master/mapel/[id] - Get single mata pelajaran
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('mata_pelajaran')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error) {
        console.error('Error fetching mapel:', error);
        return NextResponse.json({ error: 'Mata pelajaran not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
}

// PUT /api/master/mapel/[id] - Update single mata pelajaran
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { data: current } = await supabase
        .from('mata_pelajaran')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Mata pelajaran not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.kode_mapel !== undefined) updateData.kode_mapel = body.kode_mapel;
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.kelompok !== undefined) updateData.kelompok = body.kelompok;
    if (body.agama !== undefined) updateData.agama = body.agama;
    if (body.status !== undefined) updateData.status = body.status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('mata_pelajaran')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating mapel:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'UPDATE', 'mata_pelajaran', params.id, current, data);

    return NextResponse.json({ data });
}

// DELETE /api/master/mapel/[id] - Delete single mata pelajaran
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data: current } = await supabase
        .from('mata_pelajaran')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Mata pelajaran not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from('mata_pelajaran')
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('Error deleting mapel:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'DELETE', 'mata_pelajaran', params.id, current, null);

    return NextResponse.json({ success: true });
}
