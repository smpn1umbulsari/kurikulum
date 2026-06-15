import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorize';

// GET /api/master/audit-log - Get audit logs with filters and pagination
export async function GET(request: NextRequest) {
    // SEC-01 FIX: Only superadmin can view audit logs
    const auth = await authorize(['superadmin']);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const tableName = searchParams.get('table_name');
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
        .from('audit_log')
        .select(`
            *,
            user:user_id (email)
        `, { count: 'exact' });

    // Apply filters
    if (tableName) {
        query = query.eq('table_name', tableName);
    }
    if (action) {
        query = query.eq('action', action);
    }
    if (userId) {
        query = query.eq('user_id', userId);
    }
    if (dateFrom) {
        query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
    }
    if (search) {
        query = query.or(`record_id.ilike.%${search}%`);
    }

    // Order and paginate
    const { data: logs, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform logs with user email
    const transformedLogs = (logs || []).map((log: any) => ({
        ...log,
        user_email: (log.user as Record<string, unknown>)?.email || null,
    }));

    // Get summary stats
    const { data: summaryStats } = await supabase
        .from('audit_log')
        .select('action, table_name');

    const summary = {
        total_logs: count || 0,
        by_action: {
            INSERT: summaryStats?.filter((l: any) => l.action === 'INSERT').length || 0,
            UPDATE: summaryStats?.filter((l: any) => l.action === 'UPDATE').length || 0,
            DELETE: summaryStats?.filter((l: any) => l.action === 'DELETE').length || 0,
        },
        by_table: summaryStats?.reduce((acc: Record<string, number>, log: any) => {
            acc[log.table_name] = (acc[log.table_name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>) || {},
        recent_activity: [],
    };

    return NextResponse.json({
        logs: transformedLogs,
        summary,
        total_pages: Math.ceil((count || 0) / limit),
        current_page: page,
    });
}