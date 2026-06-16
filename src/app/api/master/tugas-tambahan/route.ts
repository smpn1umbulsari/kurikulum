import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/tugas-tambahan - List tugas tambahan
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan', 'guru']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const semesterId = searchParams.get('semester_id');

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

    if (!semester_id) {
        return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
        .from('tugas_tambahan')
        .select(`
            *,
            kelas_real:kelas_real_id(id, nama, jenjang)
        `)
        .eq('semester_id', semester_id);

    if (error) {
        console.error('Error fetching tugas tambahan:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Since guru table connects to pengguna, we can fetch all guru and map by pengguna_id
    const { data: gurus } = await supabase
        .from('guru')
        .select('id, nama, kode_guru, pengguna_id');

    const mappedData = (data || []).map((item: any) => {
        const matchingGuru = gurus?.find(g => g.pengguna_id === item.pengguna_id);
        return {
            ...item,
            guru: matchingGuru ? { id: matchingGuru.id, nama: matchingGuru.nama, kode_guru: matchingGuru.kode_guru } : null
        };
    });

    return NextResponse.json({ data: mappedData });
}

// POST /api/master/tugas-tambahan - Create new tugas tambahan
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { pengguna_id, semester_id, jenis, kelas_real_id } = body;

    if (!pengguna_id || !jenis) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
        .from('tugas_tambahan')
        .insert({
            pengguna_id,
            semester_id: semId,
            jenis,
            kelas_real_id: kelas_real_id || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating tugas tambahan:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'CREATE', 'tugas_tambahan', data.id, null, data);

    return NextResponse.json({ data }, { status: 201 });
}
