import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/asesmen/[id]/matrix - Get matrix ketersediaan pengawas
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();

    // Get or create kepengawasan record
    const { data: kepengawasan, error: kepError } = await supabase
        .from('kepengawasan')
        .select('matrix_mengawasi')
        .eq('asesmen_id', id)
        .single();

    if (kepError && kepError.code !== 'PGRST116') {
        // PGRST116 = no rows found
        return NextResponse.json({ error: kepError.message }, { status: 500 });
    }

    // Return matrix data or empty array
    const matrixData = kepengawasan?.matrix_mengawasi || [];

    // Transform to array format if it's stored as object
    if (Array.isArray(matrixData)) {
        return NextResponse.json(matrixData);
    }

    return NextResponse.json([]);
}

// PUT /api/asesmen/[id]/matrix - Save/update matrix ketersediaan
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authorize(['admin', 'superadmin', 'urusan']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { matrix } = body;

    if (!Array.isArray(matrix)) {
        return NextResponse.json(
            { error: 'Invalid matrix data format' },
            { status: 400 }
        );
    }

    // Upsert kepengawasan record
    const { data, error } = await supabase
        .from('kepengawasan')
        .upsert({
            asesmen_id: id,
            matrix_mengawasi: matrix,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}