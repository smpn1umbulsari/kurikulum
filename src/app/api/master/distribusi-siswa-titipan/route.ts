import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// GET /api/master/distribusi-siswa-titipan - Get siswa titipan for distribution
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

    // Get siswa that have kelas_dapo but not kelas_real (titipan)
    const { data, error } = await supabase
        .from('siswa')
        .select(`
            id, nis, nama, jenis_kelamin, status,
            siswa_kelas!inner(
                id, kelas_dapo_id, kelas_real_id, semester_id,
                kelas_dapo:kelas_dapo_id(id, nama, jenjang)
            )
        `)
        .eq('status', 'aktif')
        .eq('siswa_kelas.semester_id', semester_id)
        .not('siswa_kelas.kelas_dapo_id', 'is', null)
        .is('siswa_kelas.kelas_real_id', null)
        .order('nama', { ascending: true });

    if (error) {
        console.error('Error fetching titipan:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Get available kelas_real grouped by jenjang
    const { data: kelasReal } = await supabase
        .from('kelas_real')
        .select('*')
        .eq('semester_id', semester_id)
        .order('jenjang', { ascending: true })
        .order('nama', { ascending: true });

    return NextResponse.json({
        siswa_titipan: data || [],
        available_kelas_real: kelasReal || [],
        semester_id,
    });
}

// POST /api/master/distribusi-siswa-titipan - Move siswa titipan to kelas_real
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { siswa_id, kelas_real_id } = body;

    if (!siswa_id || !kelas_real_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Get student's current kelas_dapo jenjang
    const { data: currentAssignment } = await supabase
        .from('siswa_kelas')
        .select(`
            id, siswa_id, kelas_dapo_id, semester_id,
            kelas_dapo:kelas_dapo_id(jenjang)
        `)
        .eq('siswa_id', siswa_id)
        .eq('semester_id', activeSemester.id)
        .single();

    if (!currentAssignment) {
        return NextResponse.json({ error: 'Student has no class assignment' }, { status: 400 });
    }

    const rawKelasDapo = currentAssignment.kelas_dapo as any;
    const siswaJenjang = Array.isArray(rawKelasDapo)
        ? rawKelasDapo[0]?.jenjang
        : rawKelasDapo?.jenjang;

    // Get target kelas_real jenjang
    const { data: targetKelas } = await supabase
        .from('kelas_real')
        .select('id, jenjang, nama')
        .eq('id', kelas_real_id)
        .single();

    if (!targetKelas) {
        return NextResponse.json({ error: 'Target class not found' }, { status: 400 });
    }

    // VALIDATION: Jenjang must match
    if (siswaJenjang !== targetKelas.jenjang) {
        return NextResponse.json({
            error: `Jenjang tidak cocok! Siswa berada di jenjang ${siswaJenjang}, tetapi kelas ${targetKelas.nama} adalah jenjang ${targetKelas.jenjang}`,
            jenjang_mismatch: true,
        }, { status: 400 });
    }

    // Get current data for audit
    const { data: beforeData } = await supabase
        .from('siswa_kelas')
        .select('*')
        .eq('id', currentAssignment.id)
        .single();

    // Update kelas_real_id
    const { data, error } = await supabase
        .from('siswa_kelas')
        .update({
            kelas_real_id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', currentAssignment.id)
        .select()
        .single();

    if (error) {
        console.error('Error moving siswa:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, (auth as any).id || 'system', 'MOVE_TO_REAL', 'siswa_kelas', currentAssignment.id, beforeData, data);

    return NextResponse.json({
        success: true,
        data,
        message: `Siswa berhasil dipindahkan ke kelas ${targetKelas.nama}`,
    });
}
