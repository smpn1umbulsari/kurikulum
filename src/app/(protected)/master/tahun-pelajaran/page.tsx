'use client';

import { useState } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TahunPelajaran {
    id: string;
    nama: string;
    created_at: string;
    updated_at: string;
}

/**
 * Tahun Pelajaran Page
 * 
 * Halaman CRUD untuk mengelola tahun pelajaran.
 * Hanya accessible oleh superadmin dan admin.
 */
export default function TahunPelajaranPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    const [data, setData] = useState<TahunPelajaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TahunPelajaran | null>(null);
    const [formData, setFormData] = useState({ nama: '' });
    const [saving, setSaving] = useState(false);

    // Check permission
    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin';

    // Fetch data on mount
    useState(() => {
        fetchData();
    });

    async function fetchData() {
        try {
            const { data: result, error } = await supabase
                .from('tahun_pelajaran')
                .select('*')
                .order('nama', { ascending: false });

            if (error) throw error;
            setData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data tahun pelajaran',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    function openDialog(item?: TahunPelajaran) {
        if (item) {
            setEditingItem(item);
            setFormData({ nama: item.nama });
        } else {
            setEditingItem(null);
            setFormData({ nama: '' });
        }
        setDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingItem) {
                // Update
                const { error } = await supabase
                    .from('tahun_pelajaran')
                    .update({ nama: formData.nama })
                    .eq('id', editingItem.id);

                if (error) throw error;

                toast({
                    title: 'Berhasil',
                    description: 'Tahun pelajaran berhasil diperbarui',
                });
            } else {
                // Create
                const { error } = await supabase
                    .from('tahun_pelajaran')
                    .insert({ nama: formData.nama });

                if (error) throw error;

                toast({
                    title: 'Berhasil',
                    description: 'Tahun pelajaran berhasil ditambahkan',
                });
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

    async function handleDelete(item: TahunPelajaran) {
        if (!confirm(`Hapus tahun pelajaran "${item.nama}"?`)) return;

        try {
            const { error } = await supabase
                .from('tahun_pelajaran')
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            toast({
                title: 'Berhasil',
                description: 'Tahun pelajaran berhasil dihapus',
            });

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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Tahun Pelajaran
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola tahun pelajaran di sistem
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Tahun Pelajaran
                    </Button>
                )}
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Tahun Pelajaran</CardTitle>
                    <CardDescription>
                        {data.length} tahun pelajaran ditemukan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground">Memuat...</p>
                    ) : data.length === 0 ? (
                        <p className="text-muted-foreground">
                            Belum ada data tahun pelajaran
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {data.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <span className="text-lg font-semibold">
                                                {item.nama.split('/')[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.nama}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDialog(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
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
                                {editingItem ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Perbarui informasi tahun pelajaran'
                                    : 'Tambahkan tahun pelajaran baru'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Tahun Pelajaran</Label>
                                <Input
                                    id="nama"
                                    placeholder="2025/2026"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ nama: e.target.value })
                                    }
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    Format: TAHUN_AWAL/TAHUN_AKHIR (contoh: 2025/2026)
                                </p>
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