import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/kelas - List all classes (both dapo and real)
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type'); // 'dapo' or 'real'
    const semesterId = searchParams.get('semester_id');
    const jenjang = searchParams.get('jenjang'); // 7, 8, 9

    // Get active semester if not specified
    let semester_id = semesterId;
    if (!semester_id) {
        const { data: activeSemester } = await supabase
            .from('semester')
            .select('id')
            .eq('status', 'aktif')
            .single();
        semester_id = activeSemester?.id;
    }

    const results: any = {};

    if (!type || type === 'dapo') {
        let query = supabase
            .from('kelas_dapo')
            .select('*', { count: 'exact' })
            .eq('semester_id', semester_id)
            .order('jenjang', { ascending: true })
            .order('nama', { ascending: true });

        if (jenjang) {
            query = query.eq('jenjang', parseInt(jenjang));
        }

        const { data, count } = await query;
        results.kelas_dapo = { data, count };
    }

    if (!type || type === 'real') {
        let query = supabase
            .from('kelas_real')
            .select('*', { count: 'exact' })
            .eq('semester_id', semester_id)
            .order('jenjang', { ascending: true })
            .order('nama', { ascending: true });

        if (jenjang) {
            query = query.eq('jenjang', parseInt(jenjang));
        }

        const { data, count } = await query;
        results.kelas_real = { data, count };
    }

    return NextResponse.json(results);
}

// POST /api/master/kelas - Create new class
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { type, nama, jenjang, semester_id } = body;

    if (!['dapo', 'real'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const table = type === 'dapo' ? 'kelas_dapo' : 'kelas_real';

    // Get active semester if not specified
    let semId = semester_id;
    if (!semId) {
        const { data: activeSemester } = await supabase
            .from('semester')
            .select('id')
            .eq('status', 'aktif')
            .single();
        semId = activeSemester?.id;
    }

    const { data, error } = await supabase
        .from(table)
        .insert({
            semester_id: semId,
            nama,
            jenjang,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating kelas:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'CREATE', table, data.id, null, data);

    return NextResponse.json({ data }, { status: 201 });
}
