import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

// POST /api/master/guru/reorder - Reorder guru positions
export async function POST(request: NextRequest) {
    const auth = await authorize(['admin', 'superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json();

    const { orders } = body; // Array of { id: string, urutan: number }

    if (!Array.isArray(orders) || orders.length === 0) {
        return NextResponse.json(
            { error: 'Invalid orders array' },
            { status: 400 }
        );
    }

    // Update all positions in a transaction-like manner
    const updates = orders.map((item: { id: string; urutan: number }) =>
        supabase
            .from('guru')
            .update({ urutan: item.urutan, updated_at: new Date().toISOString() })
            .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
        console.error('Reorder errors:', errors);
        return NextResponse.json(
            { error: 'Some updates failed' },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true, updated: orders.length });
}
