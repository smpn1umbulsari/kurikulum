import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// GET /api/master/siswa/[id] - Get single siswa
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('siswa')
        .select(`
            *,
            pengguna:pengguna_id(id, nama, email, role, status)
        `)
        .eq('id', params.id)
        .single();

    if (error) {
        console.error('Error fetching siswa:', error);
        return NextResponse.json({ error: 'Siswa not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
}

// PUT /api/master/siswa/[id] - Update siswa
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { data: current } = await supabase
        .from('siswa')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Siswa not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.nis !== undefined) updateData.nis = body.nis;
    if (body.nisn !== undefined) updateData.nisn = body.nisn;
    if (body.nipd !== undefined) updateData.nipd = body.nipd;
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.jenis_kelamin !== undefined) updateData.jenis_kelamin = body.jenis_kelamin;
    if (body.pengguna_id !== undefined) updateData.pengguna_id = body.pengguna_id;
    if (body.status !== undefined) updateData.status = body.status;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('siswa')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating siswa:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'UPDATE', 'siswa', params.id, current, data);

    return NextResponse.json({ data });
}

// DELETE /api/master/siswa/[id] - Delete siswa
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data: current } = await supabase
        .from('siswa')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Siswa not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('Error deleting siswa:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'DELETE', 'siswa', params.id, current, null);

    return NextResponse.json({ success: true });
}
