import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// PUT /api/master/pembagian-mengajar-real/[id] - Update teaching assignment real
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { data: current } = await supabase
        .from('pembagian_mengajar_real')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.guru_id !== undefined) updateData.guru_id = body.guru_id;
    if (body.mata_pelajaran_id !== undefined) updateData.mata_pelajaran_id = body.mata_pelajaran_id;
    if (body.kelas_real_id !== undefined) updateData.kelas_real_id = body.kelas_real_id;
    if (body.jam_pelajaran !== undefined) updateData.jam_pelajaran = body.jam_pelajaran;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('pembagian_mengajar_real')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating pembagian mengajar real:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'UPDATE', 'pembagian_mengajar_real', params.id, current, data);

    return NextResponse.json({ data });
}

// DELETE /api/master/pembagian-mengajar-real/[id] - Delete teaching assignment real
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data: current } = await supabase
        .from('pembagian_mengajar_real')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from('pembagian_mengajar_real')
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('Error deleting pembagian mengajar real:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'DELETE', 'pembagian_mengajar_real', params.id, current, null);

    return NextResponse.json({ success: true });
}
