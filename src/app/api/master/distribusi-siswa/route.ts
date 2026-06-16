import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/distribusi-siswa - Get siswa pending distribution
export async function GET(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
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

    // Get students not yet assigned to a dapo class
    const { data, error } = await supabase
        .from('siswa')
        .select(`
            id, nis, nama, jenis_kelamin, status,
            siswa_kelas(id, kelas_dapo_id, kelas_real_id, semester_id)
        `)
        .eq('status', 'aktif')
        .order('nama', { ascending: true });

    if (error) {
        console.error('Error fetching distribusi:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Filter students without kelas_dapo assignment
    const pendingDistribution = (data || []).filter((s: any) => {
        const assignment = s.siswa_kelas?.find((sk: any) => sk.semester_id === semester_id);
        return !assignment || !assignment.kelas_dapo_id;
    });

    // Get available kelas_dapo for jenjang 7, 8, 9
    const { data: kelasDapo } = await supabase
        .from('kelas_dapo')
        .select('*')
        .eq('semester_id', semester_id)
        .order('jenjang', { ascending: true })
        .order('nama', { ascending: true });

    return NextResponse.json({
        pending_siswa: pendingDistribution,
        available_kelas: kelasDapo || [],
        semester_id,
    });
}

// POST /api/master/distribusi-siswa - Batch distribute students to kelas
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { assignments } = body; // Array of { siswa_id, kelas_dapo_id }

    if (!Array.isArray(assignments) || assignments.length === 0) {
        return NextResponse.json({ error: 'Invalid assignments' }, { status: 400 });
    }

    // Get active semester
    const { data: activeSemester } = await supabase
        .from('semester')
        .select('id')
        .eq('status', 'aktif')
        .single();

    if (!activeSemester) {
        return NextResponse.json({ error: 'No active semester' }, { status: 400 });
    }

    // Prepare upsert data
    const upsertData = assignments.map((a: any, index: number) => ({
        siswa_id: a.siswa_id,
        semester_id: activeSemester.id,
        kelas_dapo_id: a.kelas_dapo_id,
    }));

    const { data, error } = await supabase
        .from('siswa_kelas')
        .upsert(upsertData, { onConflict: 'siswa_id,semester_id' })
        .select();

    if (error) {
        console.error('Error distributing siswa:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(
        supabase, 
        (auth as any).id || 'system', 
        'BATCH_DISTRIBUTE', 
        'siswa_kelas', 
        null, 
        null, 
        { count: assignments.length }
    );

    return NextResponse.json({ success: true, distributed: assignments.length, data });
}
