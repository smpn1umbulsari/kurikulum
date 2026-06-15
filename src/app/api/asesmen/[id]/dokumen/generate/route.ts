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

    // 1. Fetch asesmen details
    const { data: asesmen, error: asesmenError } = await supabase
        .from('asesmen')
        .select('*')
        .eq('id', id)
        .single();

    if (asesmenError || !asesmen) {
        return NextResponse.json({ error: 'Asesmen tidak ditemukan.' }, { status: 404 });
    }

    if (!asesmen.kode_nus) {
        return NextResponse.json(
            { error: 'Kode NUS belum diatur. Silakan isi Kode NUS pada menu Edit Asesmen terlebih dahulu.' },
            { status: 400 }
        );
    }

    const kodeNus = asesmen.kode_nus;
    const acuanKelas = asesmen.acuan_kelas || 'real';
    const classTable = acuanKelas === 'dapo' ? 'kelas_dapo' : 'kelas_real';
    const classIdField = acuanKelas === 'dapo' ? 'kelas_dapo_id' : 'kelas_real_id';
    const absenField = acuanKelas === 'dapo' ? 'nomor_absen_dapo' : 'nomor_absen_real';

    // 2. Fetch all classes for sorting alphabetical order mapping
    const { data: classes, error: classError } = await supabase
        .from(classTable)
        .select('id, nama, jenjang')
        .eq('semester_id', asesmen.semester_id)
        .order('nama', { ascending: true });

    if (classError || !classes || classes.length === 0) {
        return NextResponse.json({ error: 'Tidak ada data kelas ditemukan.' }, { status: 400 });
    }

    // Map class order alphabetically by jenjang
    // key: class_id, value: 1-based index within that jenjang
    const classIndexMap: Record<string, number> = {};
    const jenjangClassCounters: Record<number, number> = {};

    classes.forEach((c) => {
        const jenjang = c.jenjang || 7;
        if (!jenjangClassCounters[jenjang]) {
            jenjangClassCounters[jenjang] = 0;
        }
        jenjangClassCounters[jenjang] += 1;
        classIndexMap[c.id] = jenjangClassCounters[jenjang];
    });

    // 3. Fetch all students in this semester
    const { data: students, error: studentError } = await supabase
        .from('siswa_kelas')
        .select(`
            *,
            siswa:siswa_id (id, nama, jenis_kelamin, nis),
            kelas_real:kelas_real_id (id, nama, jenjang),
            kelas_dapo:kelas_dapo_id (id, nama, jenjang)
        `)
        .eq('semester_id', asesmen.semester_id);

    if (studentError || !students || students.length === 0) {
        return NextResponse.json({ error: 'Tidak ada siswa terdaftar di semester ini.' }, { status: 400 });
    }

    // Group students by class to calculate fallback roll numbers if nomor_absen is empty
    const studentsByClass: Record<string, typeof students> = {};
    students.forEach((s) => {
        const classId = s[classIdField];
        if (classId) {
            if (!studentsByClass[classId]) {
                studentsByClass[classId] = [];
            }
            studentsByClass[classId].push(s);
        }
    });

    // Sort students inside each class alphabetically by name to assign fallback roll numbers
    Object.keys(studentsByClass).forEach((classId) => {
        studentsByClass[classId].sort((a, b) => {
            const nameA = a.siswa?.nama || '';
            const nameB = b.siswa?.nama || '';
            return nameA.localeCompare(nameB);
        });
    });

    // Generate Nomor Peserta records
    const insertRecords: Array<{
        asesmen_id: string;
        siswa_id: string;
        nomor_peserta: string;
    }> = [];

    students.forEach((sk) => {
        const classId = sk[classIdField];
        if (!classId) return; // Student has no class assigned

        const kelasObj = acuanKelas === 'dapo' ? sk.kelas_dapo : sk.kelas_real;
        if (!kelasObj) return;

        const jenjang = kelasObj.jenjang || 7;
        const classOrderIndex = classIndexMap[classId] || 1;
        const jkCode = sk.siswa?.jenis_kelamin === 'P' ? '2' : '1'; // 1 for Male, 2 for Female

        // Get or calculate roll number (nomor_absen)
        let rollNumber = sk[absenField];
        if (!rollNumber || rollNumber <= 0) {
            // Fallback: use alphabetical position in class list
            const classList = studentsByClass[classId] || [];
            const idx = classList.findIndex((item) => item.siswa_id === sk.siswa_id);
            rollNumber = idx >= 0 ? idx + 1 : 1;
        }

        // Format: [Jenjang][KodeAbjad]-[KodeNUS]-[NomorAbsen]-[JK]
        // zero-pad roll number to 3 digits
        const padRoll = String(rollNumber).padStart(3, '0');
        const nomorPeserta = `${jenjang}${classOrderIndex}-${kodeNus}-${padRoll}-${jkCode}`;

        insertRecords.push({
            asesmen_id: id,
            siswa_id: sk.siswa_id,
            nomor_peserta: nomorPeserta,
        });
    });

    if (insertRecords.length === 0) {
        return NextResponse.json({ error: 'Tidak ada data siswa yang dapat diberi nomor peserta.' }, { status: 400 });
    }

    // 4. Delete existing participant numbers for this assessment
    await supabase
        .from('asesmen_nomor_peserta')
        .delete()
        .eq('asesmen_id', id);

    // 5. Insert new records
    const { error: insertError } = await supabase
        .from('asesmen_nomor_peserta')
        .insert(insertRecords);

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch the inserted list for the client
    const { data: resultData } = await supabase
        .from('asesmen_nomor_peserta')
        .select(`
            *,
            siswa:siswa_id (id, nis, nama, jenis_kelamin)
        `)
        .eq('asesmen_id', id)
        .order('nomor_peserta', { ascending: true });

    return NextResponse.json({
        count: insertRecords.length,
        participants: resultData || [],
    });
}
