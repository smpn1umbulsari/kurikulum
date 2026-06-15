'use client';

import { useState, useEffect } from 'react';
import { useAuth, useActiveSemester } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, RefreshCw, Users, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Types
interface TugasTambahan {
    id: string;
    semester_id: string;
    guru_id: string;
    jenis_tugas: 'koordinator_7' | 'koordinator_8' | 'koordinator_9' | 'kepala_kurikulum';
    tahun_pelajaran_id: string;
    guru?: { nama: string };
}

interface WaliKelas {
    id: string;
    semester_id: string;
    kelas_real_id: string;
    guru_id: string;
    kelas_real?: { nama: string; jenjang: number };
    guru?: { nama: string };
}

// List jenis tugas tambahan
const JENIS_TUGAS = [
    { value: 'koordinator_7', label: 'Koordinator Jenjang 7' },
    { value: 'koordinator_8', label: 'Koordinator Jenjang 8' },
    { value: 'koordinator_9', label: 'Koordinator Jenjang 9' },
    { value: 'kepala_kurikulum', label: 'Kepala Kurikulum' },
];

/**
 * Tugas Tambahan & Wali Kelas Page
 * 
 * Halaman untuk mengelola tugas tambahan (koordinator, kepala kurikulum)
 * dan penetapan wali kelas.
 * 
 * Akses: superadmin, admin
 */
export default function TugasTambahanPage() {
    const { profile } = useAuth();
    const { semester } = useActiveSemester();
    const { toast } = useToast();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data state
    const [tugasTambahan, setTugasTambahan] = useState<TugasTambahan[]>([]);
    const [waliKelas, setWaliKelas] = useState<WaliKelas[]>([]);
    const [guruList, setGuruList] = useState<{ id: string; nama: string; status: string }[]>([]);
    const [kelasRealList, setKelasRealList] = useState<{ id: string; nama: string; jenjang: number }[]>([]);

    // Dialog states
    const [tugasDialogOpen, setTugasDialogOpen] = useState(false);
    const [waliDialogOpen, setWaliDialogOpen] = useState(false);
    const [editingTugas, setEditingTugas] = useState<TugasTambahan | null>(null);
    const [editingWali, setEditingWali] = useState<WaliKelas | null>(null);

    // Form states
    const [formTugas, setFormTugas] = useState({
        guru_id: '',
        jenis_tugas: '' as TugasTambahan['jenis_tugas'] | '',
    });

    const [formWali, setFormWali] = useState({
        guru_id: '',
        kelas_real_id: '',
    });

    const canManage = profile?.role === 'superadmin' || profile?.role === 'admin';

    useEffect(() => {
        if (semester?.id) {
            fetchData();
        }
    }, [semester]);

    async function fetchData() {
        if (!semester?.id) return;

        setLoading(true);
        try {
            // Fetch tugas tambahan
            const { data: tugas } = await supabase
                .from('tugas_tambahan')
                .select(`
                    *,
                    guru:guru_id (nama)
                `)
                .eq('semester_id', semester.id);

            setTugasTambahan(tugas || []);

            // Fetch wali kelas
            const { data: wali } = await supabase
                .from('wali_kelas')
                .select(`
                    *,
                    kelas_real:kelas_real_id (nama, jenjang),
                    guru:guru_id (nama)
                `)
                .eq('semester_id', semester.id);

            setWaliKelas(wali || []);

            // Fetch guru (hanya PNS, PPPK, PPPK PW - GTT tidak bisa jadi wali kelas)
            const { data: guru } = await supabase
                .from('guru')
                .select('id, nama, status')
                .in('status', ['PNS', 'PPPK', 'PPPK PW'])
                .order('nama');

            setGuruList(guru || []);

            // Fetch kelas real
            const { data: kelas } = await supabase
                .from('kelas_real')
                .select('id, nama, jenjang')
                .eq('semester_id', semester.id)
                .order('jenjang')
                .order('nama');

            setKelasRealList(kelas || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    // CRUD Tugas Tambahan
    async function handleSaveTugas() {
        if (!semester?.id || !formTugas.guru_id || !formTugas.jenis_tugas) {
            toast({
                title: 'Validasi',
                description: 'Lengkapi semua field',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            // Check if same assignment already exists
            const existing = tugasTambahan.find(
                (t) => t.jenis_tugas === formTugas.jenis_tugas && t.id !== editingTugas?.id
            );

            if (existing) {
                toast({
                    title: 'Konflik',
                    description: `Posisi ${JENIS_TUGAS.find(j => j.value === formTugas.jenis_tugas)?.label} sudah terisi`,
                    variant: 'destructive',
                });
                return;
            }

            if (editingTugas) {
                const { error } = await supabase
                    .from('tugas_tambahan')
                    .update({
                        guru_id: formTugas.guru_id,
                    })
                    .eq('id', editingTugas.id);

                if (error) throw error;

                toast({ title: 'Berhasil', description: 'Tugas tambahan diperbarui' });
            } else {
                const { error } = await supabase
                    .from('tugas_tambahan')
                    .insert({
                        semester_id: semester.id,
                        guru_id: formTugas.guru_id,
                        jenis_tugas: formTugas.jenis_tugas,
                        tahun_pelajaran_id: semester.tahun_pelajaran_id,
                    });

                if (error) throw error;

                toast({ title: 'Berhasil', description: 'Tugas tambahan ditambahkan' });
            }

            setTugasDialogOpen(false);
            setEditingTugas(null);
            setFormTugas({ guru_id: '', jenis_tugas: '' });
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan data',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteTugas(id: string) {
        if (!confirm('Yakin hapus tugas tambahan ini?')) return;

        try {
            const { error } = await supabase
                .from('tugas_tambahan')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Tugas tambahan dihapus' });
            fetchData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menghapus data',
                variant: 'destructive',
            });
        }
    }

    // CRUD Wali Kelas
    async function handleSaveWali() {
        if (!semester?.id || !formWali.guru_id || !formWali.kelas_real_id) {
            toast({
                title: 'Validasi',
                description: 'Lengkapi semua field',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            // Check if kelas already has wali
            const existing = waliKelas.find(
                (w) => w.kelas_real_id === formWali.kelas_real_id && w.id !== editingWali?.id
            );

            if (existing) {
                toast({
                    title: 'Konflik',
                    description: `Kelas ${existing.kelas_real?.nama} sudah memiliki wali kelas`,
                    variant: 'destructive',
                });
                return;
            }

            if (editingWali) {
                const { error } = await supabase
                    .from('wali_kelas')
                    .update({
                        guru_id: formWali.guru_id,
                        kelas_real_id: formWali.kelas_real_id,
                    })
                    .eq('id', editingWali.id);

                if (error) throw error;

                toast({ title: 'Berhasil', description: 'Wali kelas diperbarui' });
            } else {
                const { error } = await supabase
                    .from('wali_kelas')
                    .insert({
                        semester_id: semester.id,
                        guru_id: formWali.guru_id,
                        kelas_real_id: formWali.kelas_real_id,
                    });

                if (error) throw error;

                toast({ title: 'Berhasil', description: 'Wali kelas ditambahkan' });
            }

            setWaliDialogOpen(false);
            setEditingWali(null);
            setFormWali({ guru_id: '', kelas_real_id: '' });
            fetchData();
        } catch (error) {
            console.error('Error saving:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyimpan data',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteWali(id: string) {
        if (!confirm('Yakin hapus wali kelas ini?')) return;

        try {
            const { error } = await supabase
                .from('wali_kelas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Wali kelas dihapus' });
            fetchData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menghapus data',
                variant: 'destructive',
            });
        }
    }

    function openEditTugas(tugas: TugasTambahan) {
        setEditingTugas(tugas);
        setFormTugas({
            guru_id: tugas.guru_id,
            jenis_tugas: tugas.jenis_tugas,
        });
        setTugasDialogOpen(true);
    }

    function openEditWali(wali: WaliKelas) {
        setEditingWali(wali);
        setFormWali({
            guru_id: wali.guru_id,
            kelas_real_id: wali.kelas_real_id,
        });
        setWaliDialogOpen(true);
    }

    function openNewTugas() {
        setEditingTugas(null);
        setFormTugas({ guru_id: '', jenis_tugas: '' });
        setTugasDialogOpen(true);
    }

    function openNewWali() {
        setEditingWali(null);
        setFormWali({ guru_id: '', kelas_real_id: '' });
        setWaliDialogOpen(true);
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tugas Tambahan & Wali Kelas</h1>
                    <p className="text-muted-foreground">
                        Kelola tugas tambahan dan penetapan wali kelas
                    </p>
                    {semester && (
                        <p className="text-sm text-muted-foreground">
                            Semester aktif: <span className="font-medium">{semester.nama}</span>
                        </p>
                    )}
                </div>
                <Button onClick={() => { setLoading(true); fetchData(); }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Tugas Tambahan Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <CardTitle>Tugas Tambahan</CardTitle>
                                </div>
                                {canManage && (
                                    <Dialog open={tugasDialogOpen} onOpenChange={setTugasDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" onClick={openNewTugas}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Tambah
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {editingTugas ? 'Edit' : 'Tambah'} Tugas Tambahan
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Tetapkan guru untuk tugas tambahan
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Jenis Tugas</Label>
                                                    <Select
                                                        value={formTugas.jenis_tugas}
                                                        onValueChange={(v) =>
                                                            setFormTugas({ ...formTugas, jenis_tugas: v as any })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih jenis tugas" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {JENIS_TUGAS.map((j) => (
                                                                <SelectItem key={j.value} value={j.value}>
                                                                    {j.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Guru</Label>
                                                    <Select
                                                        value={formTugas.guru_id}
                                                        onValueChange={(v) =>
                                                            setFormTugas({ ...formTugas, guru_id: v })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih guru" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {guruList.map((g) => (
                                                                <SelectItem key={g.id} value={g.id}>
                                                                    {g.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setTugasDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button onClick={handleSaveTugas} disabled={saving}>
                                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <CardDescription>
                                Koordintor jenjang dan Kepala Kurikulum
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tugasTambahan.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Belum ada tugas tambahan</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tugasTambahan.map((tugas) => (
                                        <div
                                            key={tugas.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div>
                                                <Badge variant="outline" className="mb-1">
                                                    {JENIS_TUGAS.find((j) => j.value === tugas.jenis_tugas)?.label}
                                                </Badge>
                                                <p className="font-medium">{tugas.guru?.nama || '-'}</p>
                                            </div>
                                            {canManage && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditTugas(tugas)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteTugas(tugas.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Wali Kelas Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    <CardTitle>Wali Kelas</CardTitle>
                                </div>
                                {canManage && (
                                    <Dialog open={waliDialogOpen} onOpenChange={setWaliDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" onClick={openNewWali}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Tambah
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {editingWali ? 'Edit' : 'Tambah'} Wali Kelas
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Tetapkan wali kelas untuk kelas Real.
                                                    <span className="block mt-1 text-amber-600">
                                                        Hanya guru berstatus PNS/PPPK/PPPK PW yang dapat dipilih.
                                                    </span>
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Kelas</Label>
                                                    <Select
                                                        value={formWali.kelas_real_id}
                                                        onValueChange={(v) =>
                                                            setFormWali({ ...formWali, kelas_real_id: v })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih kelas" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {kelasRealList.map((k) => (
                                                                <SelectItem key={k.id} value={k.id}>
                                                                    Kelas {k.jenjang} - {k.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Wali Kelas</Label>
                                                    <Select
                                                        value={formWali.guru_id}
                                                        onValueChange={(v) =>
                                                            setFormWali({ ...formWali, guru_id: v })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih guru" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {guruList.map((g) => (
                                                                <SelectItem key={g.id} value={g.id}>
                                                                    {g.nama} ({g.status})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setWaliDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button onClick={handleSaveWali} disabled={saving}>
                                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <CardDescription>
                                Penetapan wali kelas per kelas Real
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {waliKelas.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <GraduationCap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Belum ada wali kelas</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {waliKelas.map((wali) => (
                                        <div
                                            key={wali.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div>
                                                <Badge variant="secondary" className="mb-1">
                                                    Kelas {wali.kelas_real?.jenjang} - {wali.kelas_real?.nama}
                                                </Badge>
                                                <p className="font-medium">{wali.guru?.nama || '-'}</p>
                                            </div>
                                            {canManage && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditWali(wali)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteWali(wali.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Info Box */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <div className="text-sm">
                            <p className="font-medium">Catatan:</p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                                <li>Hanya guru berstatus <strong>PNS, PPPK, atau PPPK PW</strong> yang dapat ditunjuk sebagai Wali Kelas</li>
                                <li>Guru berstatus GTT/PGT tidak dapat dipilih sebagai Wali Kelas</li>
                                <li>Setiap kelas Real hanya boleh memiliki 1 wali kelas</li>
                                <li>Setiap jenis tugas tambahan hanya boleh dijabat oleh 1 guru</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}