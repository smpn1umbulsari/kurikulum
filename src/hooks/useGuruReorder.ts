'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface GuruItem {
    id: string;
    kode_guru: string;
    urutan: number | null;
    nama: string;
    status_pegawai: 'PNS' | 'PPPK' | 'PPPK PW' | 'GTT';
    nip: string;
    status: 'aktif' | 'nonaktif';
}

interface UseGuruReorderOptions {
    onReorderComplete?: () => void;
}

export function useGuruReorder(options?: UseGuruReorderOptions) {
    const supabase = createClient();
    const { toast } = useToast();
    const [isReordering, setIsReordering] = useState(false);

    // Save the new order to database
    const saveOrder = useCallback(async (items: GuruItem[]) => {
        setIsReordering(true);

        try {
            // Update each item's urutan
            const updates = items.map((item, index) => ({
                id: item.id,
                urutan: index + 1,
            }));

            // Use batch update
            const results = await Promise.all(
                updates.map(({ id, urutan }) =>
                    supabase
                        .from('guru')
                        .update({ urutan })
                        .eq('id', id)
                )
            );

            // Check for errors
            const hasError = results.some(result => result.error);
            if (hasError) {
                throw new Error('Gagal menyimpan urutan');
            }

            toast({
                title: 'Berhasil',
                description: 'Urutan guru berhasil diperbarui',
            });

            options?.onReorderComplete?.();
        } catch (error) {
            console.error('Error saving order:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan urutan guru',
                variant: 'destructive',
            });
        } finally {
            setIsReordering(false);
        }
    }, [supabase, toast, options]);

    // Move item up
    const moveUp = useCallback((items: GuruItem[], itemId: string): GuruItem[] => {
        const index = items.findIndex(item => item.id === itemId);
        if (index <= 0) return items;

        const newItems = [...items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        return newItems;
    }, []);

    // Move item down
    const moveDown = useCallback((items: GuruItem[], itemId: string): GuruItem[] => {
        const index = items.findIndex(item => item.id === itemId);
        if (index < 0 || index >= items.length - 1) return items;

        const newItems = [...items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        return newItems;
    }, []);

    // Handle drag end from dnd-kit
    const handleDragEnd = useCallback(({
        items,
        activeId,
        overId,
    }: {
        items: GuruItem[];
        activeId: string;
        overId: string;
    }): GuruItem[] => {
        if (activeId === overId) return items;

        const oldIndex = items.findIndex(item => item.id === activeId);
        const newIndex = items.findIndex(item => item.id === overId);

        if (oldIndex === -1 || newIndex === -1) return items;

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        return newItems;
    }, []);

    return {
        isReordering,
        saveOrder,
        moveUp,
        moveDown,
        handleDragEnd,
    };
}

export default useGuruReorder;
