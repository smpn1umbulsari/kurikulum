import { SupabaseClient } from '@supabase/supabase-js';

export async function logAudit(
    supabase: SupabaseClient,
    penggunaId: string,
    action: string,
    table: string,
    recordId: string | null,
    dataBefore: Record<string, any> | null,
    dataAfter: Record<string, any> | null
) {
    try {
        await supabase.from('audit_log').insert({
            pengguna_id: penggunaId,
            aksi: action,
            tabel: table,
            record_id: recordId,
            data_sebelum: dataBefore,
            data_sesudah: dataAfter,
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
    }
}
