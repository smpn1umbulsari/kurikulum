import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// PUT /api/master/tugas-tambahan/[id] - Update tugas tambahan assignment
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { data: current } = await supabase
        .from('tugas_tambahan')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.pengguna_id !== undefined) updateData.pengguna_id = body.pengguna_id;
    if (body.semester_id !== undefined) updateData.semester_id = body.semester_id;
    if (body.jenis !== undefined) updateData.jenis = body.jenis;
    if (body.kelas_real_id !== undefined) updateData.kelas_real_id = body.kelas_real_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('tugas_tambahan')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating tugas tambahan:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'UPDATE', 'tugas_tambahan', params.id, current, data);

    return NextResponse.json({ data });
}

// DELETE /api/master/tugas-tambahan/[id] - Delete tugas tambahan assignment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    const { data: current } = await supabase
        .from('tugas_tambahan')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from('tugas_tambahan')
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('Error deleting tugas tambahan:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'DELETE', 'tugas_tambahan', params.id, current, null);

    return NextResponse.json({ success: true });
}
