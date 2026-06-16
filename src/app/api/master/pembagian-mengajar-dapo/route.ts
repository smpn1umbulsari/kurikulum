import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/pembagian-mengajar-dapo - List pembagian mengajar dapo
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const semesterId = searchParams.get('semester_id');
    const guruId = searchParams.get('guru_id');
    const mapelId = searchParams.get('mapel_id');
    const kelasId = searchParams.get('kelas_id');

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

    let query = supabase
        .from('pembagian_mengajar_dapo')
        .select(`
            *,
            guru:guru_id(id, nama, kode_guru),
            mata_pelajaran:mata_pelajaran_id(id, nama, kode_mapel),
            kelas_dapo:kelas_dapo_id(id, nama, jenjang)
        `, { count: 'exact' })
        .eq('semester_id', semester_id)
        .order('guru(nama)', { ascending: true });

    if (guruId) query = query.eq('guru_id', guruId);
    if (mapelId) query = query.eq('mata_pelajaran_id', mapelId);
    if (kelasId) query = query.eq('kelas_dapo_id', kelasId);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching pembagian:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ data, count });
}

// POST /api/master/pembagian-mengajar-dapo - Create pembagian mengajar
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { semester_id, guru_id, mata_pelajaran_id, kelas_dapo_id, jam_pelajaran } = body;

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
        .from('pembagian_mengajar_dapo')
        .insert({
            semester_id: semId,
            guru_id,
            mata_pelajaran_id,
            kelas_dapo_id,
            jam_pelajaran,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating pembagian:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'CREATE', 'pembagian_mengajar_dapo', data.id, null, data);

    return NextResponse.json({ data }, { status: 201 });
}
