'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DashboardSummary } from '@/types/database-extended';

export function useDashboard() {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard summary
    const fetchDashboard = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);

        try {
            const { data: result, error } = await supabase.rpc('get_dashboard_summary', {
                p_user_id: userId,
            });

            if (error) throw error;

            setData(result as DashboardSummary);
            return result as DashboardSummary;
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError('Gagal memuat dashboard');
            toast({
                title: 'Error',
                description: 'Gagal memuat data dashboard',
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Refresh dashboard
    const refresh = useCallback(async (userId: string) => {
        return fetchDashboard(userId);
    }, [fetchDashboard]);

    return {
        loading,
        data,
        error,
        fetchDashboard,
        refresh,
    };
}

export default useDashboard;
