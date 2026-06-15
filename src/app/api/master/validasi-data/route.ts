import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

// GET /api/master/validasi-data - Get cached validation results
export async function GET(request: NextRequest) {
    // SEC-01 FIX: Require admin, superadmin, or urusan role
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    // Get semester aktif
    const { data: semester } = await supabase
        .from('semester')
        .select('id')
        .eq('status', 'aktif')
        .single();

    if (!semester) {
        return NextResponse.json({
            results: [],
            summary: { total_issues: 0, errors: 0, warnings: 0, by_category: {} }
        });
    }

    const results = [];
    const byCategory: Record<string, number> = {};
    let errors = 0;
    let warnings = 0;

    // 1. Check: Siswa tanpa nilai
    const { data: siswaTanpaNilai } = await supabase
        .from('siswa')
        .select(`
            id,
            nis,
            nama,
            siswa_kelas!inner(
                kelas_real:kelas_real_id(id, nama)
            )
        `)
        .not(
            'id',
            'in',
            `(SELECT DISTINCT siswa_id FROM nilai WHERE semester_id = '${semester.id}')`
        );

    if (siswaTanpaNilai && siswaTanpaNilai.length > 0) {
        const siswaData = siswaTanpaNilai.map((s: any) => ({
            siswa_id: s.id,
            siswa_nama: s.nama,
            nis: s.nis,
            kelas_nama: s.siswa_kelas?.[0]?.kelas_real?.nama || '-',
            fix_url: `/master/nilai?siswa=${s.id}`,
        }));
        
        results.push({
            id: 'siswa_tanpa_nilai',
            category: 'siswa_tanpa_nilai',
            severity: 'warning',
            title: 'Siswa Tanpa Nilai',
            description: 'Siswa yang belum memiliki nilai di semester aktif',
            count: siswaData.length,
            data: siswaData,
            fix_url: '/master/nilai',
        });
        byCategory['siswa_tanpa_nilai'] = siswaData.length;
        warnings++;
    }

    // 2. Check: Kelas tanpa wali kelas
    const { data: kelasTanpaWali } = await supabase
        .from('kelas_real')
        .select('id, nama, jenjang')
        .not('wali_kelas_id', 'is', 'not null');

    // Actually, we need to find kelas that have NULL wali_kelas_id
    const { data: kelasTanpaWali2 } = await supabase
        .from('kelas_real')
        .select('id, nama, jenjang, wali_kelas_id')
        .is('wali_kelas_id', null);

    if (kelasTanpaWali2 && kelasTanpaWali2.length > 0) {
        const kelasData = kelasTanpaWali2.map((k: any) => ({
            kelas_id: k.id,
            kelas_nama: k.nama,
            jenjang: k.jenjang,
            detail: `Jenjang ${k.jenjang}`,
            fix_url: `/master/kelas-real/${k.id}`,
        }));

        results.push({
            id: 'kelas_tanpa_wali',
            category: 'kelas_tanpa_wali',
            severity: 'error',
            title: 'Kelas Tanpa Wali Kelas',
            description: 'Kelas yang belum memiliki wali kelas',
            count: kelasData.length,
            data: kelasData,
            fix_url: '/master/kelas-real',
        });
        byCategory['kelas_tanpa_wali'] = kelasData.length;
        errors++;
    }

    // 3. Check: Kepala sekolah kosong
    const { data: kepalaSekolah } = await supabase
        .from('kepala_sekolah')
        .select('id, nama, nuptk, status')
        .eq('status', 'aktif')
        .limit(1);

    if (!kepalaSekolah || kepalaSekolah.length === 0) {
        results.push({
            id: 'kepala_sekolah_kosong',
            category: 'kepala_sekolah_kosong',
            severity: 'error',
            title: 'Kepala Sekolah Kosong',
            description: 'Belum ada data kepala sekolah aktif. Rapor tidak bisa dicetak.',
            count: 1,
            data: [{
                detail: 'Silakan tambah data kepala sekolah di menu Master',
                fix_url: '/master/kepala-sekolah',
            }],
            fix_url: '/master/kepala-sekolah',
        });
        byCategory['kepala_sekolah_kosong'] = 1;
        errors++;
    }

    // 4. Check: Guru belum input nilai
    const { data: guruBelumInput } = await supabase
        .from('guru')
        .select(`
            id,
            nama,
            nip,
            tugas_tambahan:tugas_tambahan!inner(
                tugas_tambahan_id
            )
        `)
        .eq('tugas_tambahan.tugas_tambahan_id', 'WALI_KELAS'); // Guru yang jadi wali kelas

    // Check each wali kelas if they have nilai
    if (guruBelumInput && guruBelumInput.length > 0) {
        const guruBelumInputNilai = [];
        
        for (const guru of guruBelumInput) {
            const { data: hasNilai } = await supabase
                .from('nilai')
                .select('id')
                .eq('guru_id', guru.id)
                .eq('semester_id', semester.id)
                .limit(1);

            if (!hasNilai || hasNilai.length === 0) {
                guruBelumInputNilai.push({
                    guru_id: guru.id,
                    guru_nama: guru.nama,
                    nip: guru.nip,
                    detail: 'Belum input nilai semester ini',
                    fix_url: `/master/guru?id=${guru.id}`,
                });
            }
        }

        if (guruBelumInputNilai.length > 0) {
            results.push({
                id: 'guru_belum_input_nilai',
                category: 'guru_belum_input_nilai',
                severity: 'warning',
                title: 'Guru Belum Input Nilai',
                description: 'Wali kelas yang belum menginput nilai di semester aktif',
                count: guruBelumInputNilai.length,
                data: guruBelumInputNilai,
                fix_url: '/master/guru',
            });
            byCategory['guru_belum_input_nilai'] = guruBelumInputNilai.length;
            warnings++;
        }
    }

    const totalIssues = errors + warnings;

    return NextResponse.json({
        results,
        summary: {
            total_issues: totalIssues,
            errors,
            warnings,
            by_category: byCategory,
        },
    });
}

// POST /api/master/validasi-data/validate - Run fresh validation
export async function POST(request: NextRequest) {
    // SEC-01 FIX: Require admin or superadmin role for manual revalidation
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    // For now, just return the GET results
    // In production, this could cache results or trigger background job
    return GET(request);
}