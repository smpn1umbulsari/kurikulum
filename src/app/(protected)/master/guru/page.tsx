'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Search, Filter, GripVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableGuruRow, GuruItem } from '@/components/data-master/sortable-guru-row';
import { useGuruReorder } from '@/hooks/useGuruReorder';

const statusPegawaiOptions = [
    { value: 'PNS', label: 'PNS' },
    { value: 'PPPK', label: 'PPPK' },
    { value: 'PPPK PW', label: 'PPPK PW' },
    { value: 'GTT', label: 'GTT (Guru Tidak Tetap)' },
];

const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Nonaktif' },
];

/**
 * Guru Page
 * 
 * Halaman CRUD untuk mengelola data guru.
 * Accessible oleh superadmin dan admin.
 * Mendukung Drag & Drop reordering (Desktop) dan Tombol ▲▼ (Mobile)
 */
export default function GuruPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<GuruItem[]>([]);
    const [orderedData, setOrderedData] = useState<GuruItem[]>([]);
    const [filteredData, setFilteredData] = useState<GuruItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GuruItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [formData, setFormData] = useState({
        kode_guru: '',
        nama: '',
        status_pegawai: 'PNS' as 'PNS' | 'PPPK' | 'PPPK PW' | 'GTT',
        nip: '',
        status: 'aktif' as 'aktif' | 'nonaktif',
    });

    // Reorder hook
    const { isReordering, saveOrder, moveUp, moveDown, handleDragEnd } = useGuruReorder({
        onReorderComplete: () => {
            fetchData();
        },
    });

    // Check for mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin';

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    // Filter data
    useEffect(() => {
        let result = orderedData;

        if (searchTerm) {
            result = result.filter(
                (item) =>
                    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.kode_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.nip.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            result = result.filter((item) => item.status === filterStatus);
        }

        setFilteredData(result);
    }, [orderedData, searchTerm, filterStatus]);

    async function fetchData() {
        try {
            const { data: result, error } = await supabase
                .from('guru')
                .select('*')
                .order('urutan', { ascending: true, nullsFirst: false });

            if (error) throw error;
            setData(result || []);
            setOrderedData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data guru',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: GuruItem) {
        if (item) {
            setEditingItem(item);
            setFormData({
                kode_guru: item.kode_guru,
                nama: item.nama,
                status_pegawai: item.status_pegawai,
                nip: item.nip,
                status: item.status,
            });
        } else {
            setEditingItem(null);
            setFormData({
                kode_guru: '',
                nama: '',
                status_pegawai: 'PNS',
                nip: '',
                status: 'aktif',
            });
        }
        setDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from('guru')
                    .update({
                        kode_guru: formData.kode_guru,
                        nama: formData.nama,
                        status_pegawai: formData.status_pegawai,
                        nip: formData.nip,
                        status: formData.status,
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data guru berhasil diperbarui' });
            } else {
                // Auto-generate kode_guru if empty
                let kode_guru = formData.kode_guru;
                if (!kode_guru) {
                    const { count } = await supabase
                        .from('guru')
                        .select('*', { count: 'exact', head: true });
                    kode_guru = `GR-${String((count || 0) + 1).padStart(3, '0')}`;
                }

                // Get next urutan
                const { data: lastGuru } = await supabase
                    .from('guru')
                    .select('urutan')
                    .not('urutan', 'is', null)
                    .order('urutan', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                const urutan = lastGuru?.urutan ? lastGuru.urutan + 1 : 1;

                const { error } = await supabase.from('guru').insert({
                    kode_guru,
                    nama: formData.nama,
                    status_pegawai: formData.status_pegawai,
                    nip: formData.status_pegawai === 'GTT' ? '-' : (formData.nip || '-'),
                    status: formData.status,
                    urutan,
                });

                if (error) throw error;
                toast({ title: 'Berhasil', description: 'Data guru berhasil ditambahkan' });
            }

            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving data:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan data',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(item: GuruItem) {
        if (!confirm(`Hapus guru "${item.nama}"?`)) return;

        try {
            const { error } = await supabase.from('guru').delete().eq('id', item.id);
            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Data guru berhasil dihapus' });
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast({
                title: 'Error',
                description: 'Gagal menghapus data',
                variant: 'destructive',
            });
        }
    }

    // Handle drag end
    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const newOrderedData = handleDragEnd({
            items: orderedData,
            activeId: active.id as string,
            overId: over.id as string,
        });

        setOrderedData(newOrderedData);

        // Save immediately after drag
        saveOrder(newOrderedData);
    }

    // Handle move up/down (Mobile)
    function handleMoveUp(item: GuruItem) {
        const newOrderedData = moveUp(orderedData, item.id);
        setOrderedData(newOrderedData);
        saveOrder(newOrderedData);
    }

    function handleMoveDown(item: GuruItem) {
        const newOrderedData = moveDown(orderedData, item.id);
        setOrderedData(newOrderedData);
        saveOrder(newOrderedData);
    }

    // Get item index
    const getItemIndex = (itemId: string) => orderedData.findIndex(item => item.id === itemId);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Guru</h1>
                    <p className="text-muted-foreground">
                        Kelola data guru dan tenaga pengajar
                        {canManage && ' • Seret guru untuk mengubah urutan'}
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Guru
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, kode, atau NIP..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Guru</CardTitle>
                    <CardDescription>
                        {filteredData.length} dari {data.length} guru
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : filteredData.length === 0 ? (
                        <p className="text-muted-foreground">Tidak ada data yang cocok</p>
                    ) : (
                        <div className="overflow-x-auto">
                            {/* Desktop: DnD Context */}
                            {!isMobile ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={onDragEnd}
                                >
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b text-left text-sm text-muted-foreground">
                                                <th className="pb-3 font-medium w-10"></th>
                                                <th className="pb-3 font-medium">No</th>
                                                <th className="pb-3 font-medium">Kode</th>
                                                <th className="pb-3 font-medium">Nama</th>
                                                <th className="pb-3 font-medium">Status Pegawai</th>
                                                <th className="pb-3 font-medium">NIP</th>
                                                <th className="pb-3 font-medium">Status</th>
                                                {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <SortableContext
                                                items={filteredData.map(item => item.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {filteredData.map((item, index) => (
                                                    <SortableGuruRow
                                                        key={item.id}
                                                        item={item}
                                                        index={index}
                                                        canManage={canManage}
                                                        onEdit={openDialog}
                                                        onDelete={handleDelete}
                                                        onMoveUp={handleMoveUp}
                                                        onMoveDown={handleMoveDown}
                                                        isFirst={index === 0}
                                                        isLast={index === filteredData.length - 1}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </tbody>
                                    </table>
                                </DndContext>
                            ) : (
                                /* Mobile: Simple table with ▲▼ buttons */
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="pb-3 font-medium">No</th>
                                            <th className="pb-3 font-medium">Nama</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            {canManage && <th className="pb-3 font-medium">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((item, index) => (
                                            <SortableGuruRow
                                                key={item.id}
                                                item={item}
                                                index={index}
                                                canManage={canManage}
                                                onEdit={openDialog}
                                                onDelete={handleDelete}
                                                onMoveUp={handleMoveUp}
                                                onMoveDown={handleMoveDown}
                                                isFirst={index === 0}
                                                isLast={index === filteredData.length - 1}
                                                isMobile={true}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Edit Guru' : 'Tambah Guru'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi guru'
                                    : 'Tambahkan guru baru ke sistem'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="kode_guru">Kode Guru (Kosongkan untuk otomatis)</Label>
                                <Input
                                    id="kode_guru"
                                    placeholder="GR-001"
                                    value={formData.kode_guru}
                                    onChange={(e) =>
                                        setFormData({ ...formData, kode_guru: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input
                                    id="nama"
                                    placeholder="Nama lengkap guru"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status_pegawai">Status Pegawai</Label>
                                <Select
                                    value={formData.status_pegawai}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            status_pegawai: value as typeof formData.status_pegawai,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusPegawaiOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nip">NIP</Label>
                                <Input
                                    id="nip"
                                    placeholder="NIP (kosongkan untuk GTT)"
                                    value={formData.nip}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nip: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            status: value as typeof formData.status,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
