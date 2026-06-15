import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/asesmen/[id]/dokumen - Retrieve asesmen info and generated participant numbers
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch asesmen details
    const { data: asesmen, error: asesmenError } = await supabase
        .from('asesmen')
        .select('*, semester:semester_id(id, nama)')
        .eq('id', id)
        .single();

    if (asesmenError) {
        return NextResponse.json({ error: asesmenError.message }, { status: 500 });
    }

    // 2. Fetch all generated participant numbers
    const { data: nomorPeserta, error: npError } = await supabase
        .from('asesmen_nomor_peserta')
        .select(`
            *,
            siswa:siswa_id (
                id,
                nis,
                nama,
                jenis_kelamin
            )
        `)
        .eq('asesmen_id', id);

    if (npError) {
        return NextResponse.json({ error: npError.message }, { status: 500 });
    }

    // 3. Fetch count of total students in this semester
    const { count: studentCount, error: countError } = await supabase
        .from('siswa_kelas')
        .select('*', { count: 'exact', head: true })
        .eq('semester_id', asesmen.semester_id);

    if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // 4. Fetch classes to provide layout/room summary information if needed
    const classTable = asesmen.acuan_kelas === 'dapo' ? 'kelas_dapo' : 'kelas_real';
    const { data: classes } = await supabase
        .from(classTable)
        .select('id, nama, jenjang')
        .eq('semester_id', asesmen.semester_id)
        .order('nama', { ascending: true });

    // 5. Fetch student room assignments to display room details alongside student participant numbers
    const { data: studentRooms } = await supabase
        .from('asesmen_siswa_ruang')
        .select('siswa_id, nomor_ruang, nomor_urut')
        .eq('asesmen_id', id);

    const studentRoomMap: Record<string, { nomor_ruang: number; nomor_urut: number }> = {};
    studentRooms?.forEach((sr) => {
        studentRoomMap[sr.siswa_id] = {
            nomor_ruang: sr.nomor_ruang,
            nomor_urut: sr.nomor_urut || 0,
        };
    });

    // Join room data to participant list
    const participantList = nomorPeserta?.map((np: any) => {
        const roomInfo = studentRoomMap[np.siswa_id] || { nomor_ruang: 0, nomor_urut: 0 };
        return {
            id: np.id,
            siswa_id: np.siswa_id,
            nomor_peserta: np.nomor_peserta,
            siswa_nama: np.siswa?.nama || '',
            siswa_nis: np.siswa?.nis || '',
            siswa_jk: np.siswa?.jenis_kelamin || '',
            nomor_ruang: roomInfo.nomor_ruang,
            nomor_urut: roomInfo.nomor_urut,
        };
    }).sort((a, b) => a.nomor_peserta.localeCompare(b.nomor_peserta)) || [];

    return NextResponse.json({
        asesmen,
        total_students: studentCount || 0,
        participants: participantList,
        classes: classes || [],
    });
}
