'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, Pencil, Trash2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SiswaWithRelations } from '@/types/database';

interface SortableSiswaRowProps {
    item: SiswaWithRelations;
    index: number;
    canManage: boolean;
    onEdit: (item: SiswaWithRelations) => void;
    onDelete: (item: SiswaWithRelations) => void;
    onMoveUp: (item: SiswaWithRelations) => void;
    onMoveDown: (item: SiswaWithRelations) => void;
    isFirst: boolean;
    isLast: boolean;
    isMobile?: boolean;
    onAlumniClick?: (item: SiswaWithRelations) => void;
}

export function SortableSiswaRow({
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
    onAlumniClick,
}: SortableSiswaRowProps) {
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

    const isAlumni = item.status_siswa === 'alumni';

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-b transition-colors',
                isDragging && 'bg-muted/50 opacity-50',
                isAlumni && 'bg-amber-50/50'
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
            <td className="py-3 font-mono text-sm">{item.nisn}</td>
            <td className="py-3 font-mono text-sm">{item.nis}</td>
            <td className="py-3 font-medium">{item.nama}</td>
            {!isMobile && (
                <>
                    <td className="py-3 text-sm">
                        {item.jenjang}
                    </td>
                    <td className="py-3 text-sm">
                        {item.kelas_dapo?.nama || '-'}
                    </td>
                    <td className="py-3 text-sm">
                        {item.kelas_real?.nama || '-'}
                    </td>
                </>
            )}
            <td className="py-3">
                <span
                    className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        item.status_siswa === 'aktif'
                            ? 'bg-green-100 text-green-800'
                            : item.status_siswa === 'alumni'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                    )}
                >
                    {item.status_siswa}
                </span>
            </td>
            {!isMobile && item.tahun_lulus && (
                <td className="py-3 text-sm font-medium">
                    {item.tahun_lulus}
                </td>
            )}
            {canManage && (
                <td className="py-3">
                    <div className="flex items-center gap-1">
                        {/* Alumni Button */}
                        {!isAlumni && onAlumniClick && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onAlumniClick(item)}
                                className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                title="Jadikan Alumni"
                            >
                                <Award className="h-4 w-4" />
                            </Button>
                        )}
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

export default SortableSiswaRow;
