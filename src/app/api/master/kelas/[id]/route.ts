import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// PUT /api/master/kelas/[id] - Update single class (dapo or real)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dapo';

    if (!['dapo', 'real'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const table = type === 'dapo' ? 'kelas_dapo' : 'kelas_real';
    const body = await request.json();

    // Get current data for audit
    const { data: current } = await supabase
        .from(table)
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Kelas not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.jenjang !== undefined) updateData.jenjang = body.jenjang;
    if (body.semester_id !== undefined) updateData.semester_id = body.semester_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating kelas:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'UPDATE', table, params.id, current, data);

    return NextResponse.json({ data });
}

// DELETE /api/master/kelas/[id] - Delete single class (dapo or real)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dapo';

    if (!['dapo', 'real'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const table = type === 'dapo' ? 'kelas_dapo' : 'kelas_real';

    // Get current data for audit
    const { data: current } = await supabase
        .from(table)
        .select('*')
        .eq('id', params.id)
        .single();

    if (!current) {
        return NextResponse.json({ error: 'Kelas not found' }, { status: 404 });
    }

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('Error deleting kelas:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'DELETE', table, params.id, current, null);

    return NextResponse.json({ success: true });
}
