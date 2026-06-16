import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// GET /api/master/guru/[id] - Get single guru
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('guru')
        .select(`
            *,
            pengguna:pengguna_id(id, nama, email, role, status)
        `)
        .eq('id', params.id)
        .single();

    if (error) {
        console.error('Error fetching guru:', error);
        return NextResponse.json(
            { error: 'Guru not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({ data });
}

// PUT /api/master/guru/[id] - Update guru
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    // Get current data for audit
    const { data: current } = await supabase
        .from('guru')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Guru not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.kode_guru !== undefined) updateData.kode_guru = body.kode_guru;
    if (body.nip !== undefined) {
        updateData.nip = body.status_pegawai === 'GTT' ? '-' : (body.nip || current.nip);
    }
    if (body.status_pegawai !== undefined) updateData.status_pegawai = body.status_pegawai;
    if (body.pengguna_id !== undefined) updateData.pengguna_id = body.pengguna_id;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.urutan !== undefined) updateData.urutan = body.urutan;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('guru')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating guru:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'UPDATE', 'guru', params.id, current, data);

    return NextResponse.json({ data });
}

// DELETE /api/master/guru/[id] - Delete guru
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    // Get current data for audit
    const { data: current } = await supabase
        .from('guru')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Guru not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from('guru')
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('Error deleting guru:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'DELETE', 'guru', params.id, current, null);

    return NextResponse.json({ success: true });
}
