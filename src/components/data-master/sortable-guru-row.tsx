'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface GuruItem {
    id: string;
    kode_guru: string;
    urutan: number | null;
    nama: string;
    status_pegawai: 'PNS' | 'PPPK' | 'PPPK PW' | 'GTT';
    nip: string;
    status: 'aktif' | 'nonaktif';
}

interface SortableGuruRowProps {
    item: GuruItem;
    index: number;
    canManage: boolean;
    onEdit: (item: GuruItem) => void;
    onDelete: (item: GuruItem) => void;
    onMoveUp: (item: GuruItem) => void;
    onMoveDown: (item: GuruItem) => void;
    isFirst: boolean;
    isLast: boolean;
    isMobile?: boolean;
}

export function SortableGuruRow({
    item,
    index,
    canManage,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    isMobile = false,
}: SortableGuruRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-b transition-colors',
                isDragging && 'bg-muted/50 opacity-50'
            )}
        >
            {/* Drag Handle - Desktop only */}
            {!isMobile && (
                <td className="py-3 w-10">
                    {canManage && (
                        <button
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                            title="Seret untuk mengubah urutan"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </td>
            )}

            <td className={cn('py-3', isMobile ? 'pl-2' : '')}>{index + 1}</td>
            <td className="py-3 font-mono text-sm">{item.kode_guru}</td>
            <td className="py-3 font-medium">{item.nama}</td>
            <td className="py-3">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                    {item.status_pegawai}
                </span>
            </td>
            <td className="py-3 font-mono text-sm">{item.nip}</td>
            <td className="py-3">
                <span
                    className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        item.status === 'aktif'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    )}
                >
                    {item.status}
                </span>
            </td>
            {canManage && (
                <td className="py-3">
                    <div className="flex items-center gap-1">
                        {/* Move Up/Down Buttons - Mobile */}
                        {isMobile && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onMoveUp(item)}
                                    disabled={isFirst}
                                    className="h-8 w-8"
                                    title="Pindah ke atas"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onMoveDown(item)}
                                    disabled={isLast}
                                    className="h-8 w-8"
                                    title="Pindah ke bawah"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </td>
            )}
        </tr>
    );
}

export default SortableGuruRow;
