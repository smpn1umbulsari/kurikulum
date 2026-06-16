import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';
import { logAudit } from '@/lib/audit';

// POST /api/master/sinkronisasi-mengajar - Synchronize teaching assignments
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { direction, resolveStrategy } = body; // direction: 'dapo_to_real' | 'real_to_dapo', strategy: 'replace' | 'merge'
    
    if (direction !== 'dapo_to_real' && direction !== 'real_to_dapo') {
        return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
    }

    const strategy = resolveStrategy || 'replace'; // 'replace' or 'merge'

    // Get active semester
    const { data: activeSemester } = await supabase
        .from('semester')
        .select('id')
        .eq('status', 'aktif')
        .single();

    if (!activeSemester) {
        return NextResponse.json({ error: 'No active semester' }, { status: 400 });
    }

    // Fetch classes for mapping
    const { data: kelasReal } = await supabase
        .from('kelas_real')
        .select('id, nama, jenjang')
        .eq('semester_id', activeSemester.id);

    const { data: kelasDapo } = await supabase
        .from('kelas_dapo')
        .select('id, nama, jenjang')
        .eq('semester_id', activeSemester.id);

    if (!kelasReal || !kelasDapo) {
        return NextResponse.json({ error: 'No classes found for mapping' }, { status: 400 });
    }

    // Map dapo to real
    const dapoToRealMap = new Map<string, string>(); // dapo_id -> real_id
    const realToDapoMap = new Map<string, string>(); // real_id -> dapo_id

    kelasDapo.forEach(kd => {
        const match = kelasReal.find(kr => kr.jenjang === kd.jenjang && kr.nama === kd.nama);
        if (match) {
            dapoToRealMap.set(kd.id, match.id);
            realToDapoMap.set(match.id, kd.id);
        }
    });

    let syncedCount = 0;

    if (direction === 'dapo_to_real') {
        // Fetch dapo assignments
        const { data: dapoAssignments } = await supabase
            .from('pembagian_mengajar_dapo')
            .select('*')
            .eq('semester_id', activeSemester.id);

        if (!dapoAssignments || dapoAssignments.length === 0) {
            return NextResponse.json({ success: true, synced_records: 0, message: 'No dapo records found' });
        }

        if (strategy === 'replace') {
            // Delete all real
            const { error: delError } = await supabase
                .from('pembagian_mengajar_real')
                .delete()
                .eq('semester_id', activeSemester.id);

            if (delError) {
                return NextResponse.json({ error: delError.message }, { status: 400 });
            }

            // Map and insert
            const toInsert = dapoAssignments.map(da => ({
                semester_id: activeSemester.id,
                guru_id: da.guru_id,
                mata_pelajaran_id: da.mata_pelajaran_id,
                kelas_real_id: dapoToRealMap.get(da.kelas_dapo_id) || da.kelas_dapo_id,
                jam_pelajaran: da.jam_pelajaran,
            }));

            const { error: insError } = await supabase
                .from('pembagian_mengajar_real')
                .insert(toInsert);

            if (insError) {
                return NextResponse.json({ error: insError.message }, { status: 400 });
            }

            syncedCount = toInsert.length;
        } else {
            // Merge mode: only add missing
            const { data: existingReal } = await supabase
                .from('pembagian_mengajar_real')
                .select('guru_id, mata_pelajaran_id, kelas_real_id')
                .eq('semester_id', activeSemester.id);

            const existingKeys = new Set(
                (existingReal || []).map(r => `${r.guru_id}-${r.mata_pelajaran_id}-${r.kelas_real_id}`)
            );

            const toInsert = dapoAssignments
                .filter(da => {
                    const targetRealId = dapoToRealMap.get(da.kelas_dapo_id) || da.kelas_dapo_id;
                    return !existingKeys.has(`${da.guru_id}-${da.mata_pelajaran_id}-${targetRealId}`);
                })
                .map(da => ({
                    semester_id: activeSemester.id,
                    guru_id: da.guru_id,
                    mata_pelajaran_id: da.mata_pelajaran_id,
                    kelas_real_id: dapoToRealMap.get(da.kelas_dapo_id) || da.kelas_dapo_id,
                    jam_pelajaran: da.jam_pelajaran,
                }));

            if (toInsert.length > 0) {
                const { error: insError } = await supabase
                    .from('pembagian_mengajar_real')
                    .insert(toInsert);

                if (insError) {
                    return NextResponse.json({ error: insError.message }, { status: 400 });
                }
            }

            syncedCount = toInsert.length;
        }
    } else {
        // real_to_dapo
        // Fetch real assignments
        const { data: realAssignments } = await supabase
            .from('pembagian_mengajar_real')
            .select('*')
            .eq('semester_id', activeSemester.id);

        if (!realAssignments || realAssignments.length === 0) {
            return NextResponse.json({ success: true, synced_records: 0, message: 'No real records found' });
        }

        if (strategy === 'replace') {
            // Delete all dapo
            const { error: delError } = await supabase
                .from('pembagian_mengajar_dapo')
                .delete()
                .eq('semester_id', activeSemester.id);

            if (delError) {
                return NextResponse.json({ error: delError.message }, { status: 400 });
            }

            // Map and insert
            const toInsert = realAssignments.map(ra => ({
                semester_id: activeSemester.id,
                guru_id: ra.guru_id,
                mata_pelajaran_id: ra.mata_pelajaran_id,
                kelas_dapo_id: realToDapoMap.get(ra.kelas_real_id) || ra.kelas_real_id,
                jam_pelajaran: ra.jam_pelajaran,
            }));

            const { error: insError } = await supabase
                .from('pembagian_mengajar_dapo')
                .insert(toInsert);

            if (insError) {
                return NextResponse.json({ error: insError.message }, { status: 400 });
            }

            syncedCount = toInsert.length;
        } else {
            // Merge
            const { data: existingDapo } = await supabase
                .from('pembagian_mengajar_dapo')
                .select('guru_id, mata_pelajaran_id, kelas_dapo_id')
                .eq('semester_id', activeSemester.id);

            const existingKeys = new Set(
                (existingDapo || []).map(d => `${d.guru_id}-${d.mata_pelajaran_id}-${d.kelas_dapo_id}`)
            );

            const toInsert = realAssignments
                .filter(ra => {
                    const targetDapoId = realToDapoMap.get(ra.kelas_real_id) || ra.kelas_real_id;
                    return !existingKeys.has(`${ra.guru_id}-${ra.mata_pelajaran_id}-${targetDapoId}`);
                })
                .map(ra => ({
                    semester_id: activeSemester.id,
                    guru_id: ra.guru_id,
                    mata_pelajaran_id: ra.mata_pelajaran_id,
                    kelas_dapo_id: realToDapoMap.get(ra.kelas_real_id) || ra.kelas_real_id,
                    jam_pelajaran: ra.jam_pelajaran,
                }));

            if (toInsert.length > 0) {
                const { error: insError } = await supabase
                    .from('pembagian_mengajar_dapo')
                    .insert(toInsert);

                if (insError) {
                    return NextResponse.json({ error: insError.message }, { status: 400 });
                }
            }

            syncedCount = toInsert.length;
        }
    }

    await logAudit(
        supabase, 
        (auth as any).id || 'system', 
        'SYNC_PEMBAGIAN_MENGAJAR', 
        direction === 'dapo_to_real' ? 'pembagian_mengajar_real' : 'pembagian_mengajar_dapo', 
        null, 
        null, 
        { direction, strategy, syncedCount }
    );

    return NextResponse.json({
        success: true,
        synced_records: syncedCount,
        message: `Sinkronisasi berhasil memproses ${syncedCount} baris data.`
    });
}
