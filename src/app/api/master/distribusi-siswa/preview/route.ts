import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

// GET /api/master/distribusi-siswa/preview - Preview changes before saving
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

    // Get all siswa
    const { data: siswaData, error } = await supabase
        .from('siswa')
        .select(`
            id, nis, nama,
            siswa_kelas(id, kelas_dapo_id, semester_id)
        `)
        .eq('status', 'aktif');

    if (error) {
        console.error('Error previewing distribusi:', error);
        return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }

    // Filter pending siswa
    const pendingSiswa = (siswaData || []).filter((s: any) => {
        const assignment = s.siswa_kelas?.find((sk: any) => sk.semester_id === semester_id);
        return !assignment || !assignment.kelas_dapo_id;
    });

    return NextResponse.json({
        success: true,
        total_pending: pendingSiswa.length,
        message: `${pendingSiswa.length} siswa siap didistribusikan.`,
    });
}
