import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/asesmen/[id]/ruang/generate - Generate automatic ruang allocation
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    // Get asesmen
    const { data: asesmen } = await supabase
        .from('asesmen')
        .select('*, semester:semester_id(id)')
        .eq('id', id)
        .single();

    if (!asesmen) {
        return NextResponse.json({ error: 'Asesmen not found' }, { status: 404 });
    }

    // Get pengaturan
    const { data: ruangData } = await supabase
        .from('asesmen_ruang')
        .select('pengaturan')
        .eq('asesmen_id', id)
        .single();

    const pengaturan = ruangData?.pengaturan || {
        kapasitas_default: 24,
        mode_pembagian: '固定20',
        pengaturan_7: { aktif: true, urutan: 'az', ruang_awal: 71, ruang_akhir: 75 },
        pengaturan_8: { aktif: true, urutan: 'az', ruang_awal: 81, ruang_akhir: 85 },
        pengaturan_9: { aktif: true, urutan: 'az', ruang_awal: 91, ruang_akhir: 95 },
    };

    // Get students based on acuan_kelas
    const kelasField = asesmen.acuan_kelas === 'dapo' ? 'kelas_dapo_id' : 'kelas_real_id';
    const kelasTable = asesmen.acuan_kelas === 'dapo' ? 'kelas_dapo' : 'kelas_real';

    const { data: siswaData } = await supabase
        .from('siswa_kelas')
        .select(`
            *,
            siswa:siswa_id(id, nis, nama, jenis_kelamin),
            kelas_real:kelas_real_id(id, nama, jenjang),
            kelas_dapo:kelas_dapo_id(id, nama, jenjang)
        `)
        .eq('semester_id', asesmen.semester_id);

    if (!siswaData || siswaData.length === 0) {
        return NextResponse.json({ error: 'Tidak ada siswa di semester ini' }, { status: 400 });
    }

    // Delete existing assignments
    await supabase
        .from('asesmen_siswa_ruang')
        .delete()
        .eq('asesmen_id', id);

    // Group students by jenjang
    const siswaByJenjang: Record<number, typeof siswaData> = {};
    for (const sk of siswaData) {
        const kelas = sk.kelas_real || sk.kelas_dapo;
        const jenjang = kelas?.jenjang || 7;
        if (!siswaByJenjang[jenjang]) siswaByJenjang[jenjang] = [];
        siswaByJenjang[jenjang].push(sk);
    }

    // Sort students within each jenjang
    for (const jenjang of Object.keys(siswaByJenjang).map(Number)) {
        const cfg = pengaturan[`pengaturan_${jenjang}`];
        if (!cfg?.aktif) continue;

        siswaByJenjang[jenjang].sort((a, b) => {
            const nameA = a.siswa?.nama || '';
            const nameB = b.siswa?.nama || '';
            return cfg.urutan === 'az' 
                ? nameA.localeCompare(nameB) 
                : nameB.localeCompare(nameA);
        });
    }

    // Generate ruang assignments
    const assignments: Array<{
        asesmen_id: string;
        siswa_id: string;
        nomor_ruang: number;
        nomor_urut: number;
    }> = [];

    const kapasitasDefault = pengaturan.kapasitas_default || 24;
    const mode = pengaturan.mode_pembagian || '固定20';

    for (const jenjang of [7, 8, 9]) {
        const cfg = pengaturan[`pengaturan_${jenjang}`];
        if (!cfg?.aktif) continue;

        const siswaList = siswaByJenjang[jenjang] || [];
        if (siswaList.length === 0) continue;

        const ruangAwal = cfg.ruang_awal || (jenjang * 10 + 1);
        const ruangAkhir = cfg.ruang_akhir || (jenjang * 10 + 5);

        let ruang = ruangAwal;
        let nomorUrut = 1;
        let currentCapacity = 0;
        const maxCapacity = mode === 'setengah' 
            ? Math.ceil(siswaList.length / (ruangAkhir - ruangAwal + 1) / 2)
            : mode === '固定20' ? 20 : kapasitasDefault;

        for (const sk of siswaList) {
            if (currentCapacity >= maxCapacity) {
                ruang++;
                nomorUrut = 1;
                currentCapacity = 0;
            }

            if (ruang > ruangAkhir) {
                // Ruang penuh, continue to next jenjang
                break;
            }

            assignments.push({
                asesmen_id: id,
                siswa_id: sk.siswa_id,
                nomor_ruang: ruang,
                nomor_urut: nomorUrut,
            });

            nomorUrut++;
            currentCapacity++;
        }
    }

    // Insert assignments
    if (assignments.length > 0) {
        const { error } = await supabase
            .from('asesmen_siswa_ruang')
            .insert(assignments);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // Get inserted data for response
    const { data: resultData } = await supabase
        .from('asesmen_siswa_ruang')
        .select(`
            *,
            siswa:siswa_id(nis, nama),
            kelas_real:kelas_real_id(nama, jenjang)
        `)
        .eq('asesmen_id', id)
        .order('nomor_ruang', { ascending: true })
        .order('nomor_urut', { ascending: true });

    return NextResponse.json({
        count: assignments.length,
        siswa_ruangs: resultData,
    });
}