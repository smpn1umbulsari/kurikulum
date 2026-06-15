import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    // 1. Get kepengawasan settings
    const { data: kepengawasan } = await supabase
        .from('kepengawasan')
        .select('*')
        .eq('asesmen_id', id)
        .maybeSingle();

    const pengaturan = kepengawasan?.pengaturan || { pengawas_per_ruang: 1, mode_auto: 'urut' };
    const pengawasPerRuang = pengaturan.pengawas_per_ruang || 1;
    const modeAuto = pengaturan.mode_auto || 'urut';

    // 2. Fetch all schedules (jadwal)
    const { data: jadwals } = await supabase
        .from('asesmen_jadwal')
        .select('*')
        .eq('asesmen_id', id)
        .order('tanggal', { ascending: true })
        .order('jam_mulai', { ascending: true })
        .order('urutan', { ascending: true });

    if (!jadwals || jadwals.length === 0) {
        return NextResponse.json({ error: 'Belum ada jadwal ujian untuk asesmen ini.' }, { status: 400 });
    }

    // 3. Fetch all active gurus
    const { data: gurus } = await supabase
        .from('guru')
        .select('id, nama, kode_guru, urutan')
        .eq('status', 'aktif')
        .order('urutan', { ascending: true });

    if (!gurus || gurus.length === 0) {
        return NextResponse.json({ error: 'Tidak ada guru aktif.' }, { status: 400 });
    }

    // 4. Fetch distinct rooms from siswa ruang
    const { data: ruangData } = await supabase
        .from('asesmen_siswa_ruang')
        .select('nomor_ruang')
        .eq('asesmen_id', id);

    const rooms = Array.from(new Set(ruangData?.map((r) => r.nomor_ruang) || [])).sort((a, b) => a - b);

    if (rooms.length === 0) {
        return NextResponse.json({ error: 'Belum ada pembagian ruang siswa. Generate ruang terlebih dahulu.' }, { status: 400 });
    }

    // 5. Get ketersediaan matrix
    const matrix = kepengawasan?.matrix_mengawasi || [];
    const availabilityMap: Record<string, Set<string>> = {}; // key: jadwal_id, value: Set of available guru_ids

    // Populate availability map
    if (Array.isArray(matrix)) {
        matrix.forEach((cell: any) => {
            if (cell.tersedia) {
                if (!availabilityMap[cell.jadwal_id]) {
                    availabilityMap[cell.jadwal_id] = new Set();
                }
                availabilityMap[cell.jadwal_id].add(cell.guru_id);
            }
        });
    }

    // Initialize trackers
    const teacherAssignmentCounts: Record<string, number> = {};
    gurus.forEach((g) => {
        teacherAssignmentCounts[g.id] = 0;
    });

    let previousSlotAssignedGurus = new Set<string>();
    const generatedAssignments: Array<{
        jadwal_id: string;
        nomor_ruang: number;
        guru_id: string;
        urutan_pengawas: number;
    }> = [];

    // 6. Generate Assignments slot by slot
    for (const jadwal of jadwals) {
        const availableGurusForSlot = availabilityMap[jadwal.id] || new Set<string>();
        const currentSlotAssignedGurus = new Set<string>();

        for (const room of rooms) {
            for (let up = 1; up <= pengawasPerRuang; up++) {
                // Filter gurus who are available AND not already assigned to another room in this same slot
                const candidateGurus = gurus.filter((g) => {
                    return (
                        availableGurusForSlot.has(g.id) &&
                        !currentSlotAssignedGurus.has(g.id)
                    );
                });

                if (candidateGurus.length === 0) {
                    // No available supervisor left for this slot and position
                    continue;
                }

                // Sort candidates based on mode
                candidateGurus.sort((a, b) => {
                    const wasAPrev = previousSlotAssignedGurus.has(a.id);
                    const wasBPrev = previousSlotAssignedGurus.has(b.id);

                    // 1. Avoid consecutive assignments (prioritize those who didn't supervise in the previous slot)
                    if (wasAPrev !== wasBPrev) {
                        return wasAPrev ? 1 : -1;
                    }

                    if (modeAuto === 'acak') {
                        // 2. Balanced distribution (prioritize those with fewer total assignments)
                        const countA = teacherAssignmentCounts[a.id];
                        const countB = teacherAssignmentCounts[b.id];
                        if (countA !== countB) {
                            return countA - countB;
                        }
                        // Randomizer tie-breaker
                        return Math.random() - 0.5;
                    } else {
                        // 2. Sequential distribution based on guru urutan
                        const countA = teacherAssignmentCounts[a.id];
                        const countB = teacherAssignmentCounts[b.id];
                        if (countA !== countB) {
                            return countA - countB;
                        }
                        return (a.urutan || 0) - (b.urutan || 0);
                    }
                });

                // Assign the best candidate
                const selectedGuru = candidateGurus[0];
                generatedAssignments.push({
                    jadwal_id: jadwal.id,
                    nomor_ruang: room,
                    guru_id: selectedGuru.id,
                    urutan_pengawas: up,
                });

                currentSlotAssignedGurus.add(selectedGuru.id);
                teacherAssignmentCounts[selectedGuru.id] += 1;
            }
        }

        // Save current slot assignments as previous for the next iteration
        previousSlotAssignedGurus = currentSlotAssignedGurus;
    }

    // 7. Save generated assignments to database
    // Ensure kepengawasan record exists and get its ID
    const { data: kepRecord, error: upsertError } = await supabase
        .from('kepengawasan')
        .upsert({
            asesmen_id: id,
            pengaturan: pengaturan,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Delete existing assignments for this kepengawasan
    await supabase
        .from('kepengawasan_assignments')
        .delete()
        .eq('kepengawasan_id', kepRecord.id);

    // Insert new assignments
    if (generatedAssignments.length > 0) {
        const insertData = generatedAssignments.map((ga) => ({
            kepengawasan_id: kepRecord.id,
            jadwal_id: ga.jadwal_id,
            nomor_ruang: ga.nomor_ruang,
            guru_id: ga.guru_id,
            urutan_pengawas: ga.urutan_pengawas,
        }));

        const { error: insertError } = await supabase
            .from('kepengawasan_assignments')
            .insert(insertData);

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
    }

    // Return the generated assignments with teacher details
    const { data: resultData } = await supabase
        .from('kepengawasan_assignments')
        .select(`
            *,
            guru:guru_id (id, nama, kode_guru)
        `)
        .eq('kepengawasan_id', kepRecord.id);

    return NextResponse.json({
        count: generatedAssignments.length,
        assignments: resultData || [],
    });
}
