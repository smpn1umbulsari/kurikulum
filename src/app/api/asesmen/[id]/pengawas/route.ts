import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/asesmen/[id]/pengawas - Retrieve kepengawasan settings, assignments, rooms, active gurus, and schedules
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch kepengawasan row
    const { data: kepengawasan, error: kepError } = await supabase
        .from('kepengawasan')
        .select('*')
        .eq('asesmen_id', id)
        .maybeSingle();

    if (kepError) {
        return NextResponse.json({ error: kepError.message }, { status: 500 });
    }

    // Default settings if kepengawasan does not exist yet
    const defaultKepengawasan = {
        asesmen_id: id,
        matrix_mengawasi: [],
        pengaturan: { pengawas_per_ruang: 1, mode_auto: 'urut' },
        publish_kartu: false,
    };

    const currentKepengawasan = kepengawasan || defaultKepengawasan;

    // 2. Fetch assignments
    let assignments: any[] = [];
    if (kepengawasan?.id) {
        const { data: assignData, error: assignError } = await supabase
            .from('kepengawasan_assignments')
            .select(`
                *,
                guru:guru_id (id, nama, kode_guru)
            `)
            .eq('kepengawasan_id', kepengawasan.id);

        if (assignError) {
            return NextResponse.json({ error: assignError.message }, { status: 500 });
        }
        assignments = assignData || [];
    }

    // 3. Fetch distinct rooms from student room assignments
    const { data: ruangData, error: ruangError } = await supabase
        .from('asesmen_siswa_ruang')
        .select('nomor_ruang')
        .eq('asesmen_id', id);

    if (ruangError) {
        return NextResponse.json({ error: ruangError.message }, { status: 500 });
    }

    const rooms = Array.from(new Set(ruangData?.map((r) => r.nomor_ruang) || [])).sort((a, b) => a - b);

    // 4. Fetch active gurus
    const { data: gurus, error: gurusError } = await supabase
        .from('guru')
        .select('id, nama, kode_guru')
        .eq('status', 'aktif')
        .order('urutan', { ascending: true });

    if (gurusError) {
        return NextResponse.json({ error: gurusError.message }, { status: 500 });
    }

    // 5. Fetch schedules (jadwal)
    const { data: jadwals, error: jadwalError } = await supabase
        .from('asesmen_jadwal')
        .select(`
            *,
            mata_pelajaran:mata_pelajaran_id (
                id,
                kode_mapel,
                nama
            )
        `)
        .eq('asesmen_id', id)
        .order('urutan', { ascending: true });

    if (jadwalError) {
        return NextResponse.json({ error: jadwalError.message }, { status: 500 });
    }

    const transformedJadwals = jadwals?.map((j) => ({
        ...j,
        mata_pelajaran_nama: j.mata_pelajaran?.nama
            ? `${j.mata_pelajaran?.kode_mapel} - ${j.mata_pelajaran?.nama}`
            : null,
    })) || [];

    return NextResponse.json({
        kepengawasan: currentKepengawasan,
        assignments,
        rooms,
        gurus,
        jadwals: transformedJadwals,
    });
}

// PUT /api/asesmen/[id]/pengawas - Update kepengawasan settings, assignments, and publish status
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { pengaturan, publish_kartu, assignments } = body;

    // 1. Upsert kepengawasan row
    const { data: kepRecord, error: kepError } = await supabase
        .from('kepengawasan')
        .upsert({
            asesmen_id: id,
            pengaturan: pengaturan || { pengawas_per_ruang: 1, mode_auto: 'urut' },
            publish_kartu: publish_kartu ?? false,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (kepError) {
        return NextResponse.json({ error: kepError.message }, { status: 500 });
    }

    // 2. Update assignments if provided
    if (assignments && Array.isArray(assignments)) {
        const { error: deleteError } = await supabase
            .from('kepengawasan_assignments')
            .delete()
            .eq('kepengawasan_id', kepRecord.id);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        if (assignments.length > 0) {
            const insertData = assignments.map((a: any) => ({
                kepengawasan_id: kepRecord.id,
                jadwal_id: a.jadwal_id,
                nomor_ruang: a.nomor_ruang,
                guru_id: a.guru_id,
                urutan_pengawas: a.urutan_pengawas || 1,
            }));

            const { error: insertError } = await supabase
                .from('kepengawasan_assignments')
                .insert(insertData);

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
        }
    }

    // Update publish status on kartu_pengawas table if published
    if (publish_kartu !== undefined) {
        // We can upsert or insert into kartu_pengawas table to store published dates for teachers
        // First get the distinct teachers assigned to this asesmen
        if (assignments && Array.isArray(assignments)) {
            const assignedGurus = Array.from(new Set(assignments.map((a: any) => a.guru_id))) as string[];
            if (assignedGurus.length > 0) {
                const nowStr = publish_kartu ? new Date().toISOString() : null;
                
                // Construct cards
                const cardRecords = assignedGurus.map((gId) => ({
                    asesmen_id: id,
                    guru_id: gId,
                    published_at: nowStr,
                    updated_at: new Date().toISOString(),
                }));

                const { error: cardError } = await supabase
                    .from('kartu_pengawas')
                    .upsert(cardRecords, { onConflict: 'asesmen_id,guru_id' });

                if (cardError) {
                    console.error('Error updating kartu_pengawas status:', cardError);
                }
            }
        }
    }

    return NextResponse.json({ success: true, kepengawasan: kepRecord });
}
