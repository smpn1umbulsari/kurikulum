'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Database,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    Clock,
    HardDrive,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    FileJson,
    Settings,
    MoreVertical,
    Shield,
} from 'lucide-react';

interface Backup {
    id: string;
    name: string;
    size: number;
    created_at: string;
    status: 'completed' | 'pending' | 'failed';
    type: 'manual' | 'automatic';
}

interface ScheduleConfig {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    day_of_week?: number;
    day_of_month?: number;
}

export default function BackupRestorePage() {
    const { toast } = useToast();
    
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<ScheduleConfig>({
        enabled: false,
        frequency: 'daily',
        time: '02:00',
    });
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        backupId?: string;
        type: 'restore' | 'delete';
    }>({ open: false, type: 'restore' });
    const [password, setPassword] = useState('');

    const fetchBackups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master/backup');
            if (res.ok) {
                const data = await res.json();
                setBackups(data.backups || []);
                if (data.schedule) {
                    setSchedule(data.schedule);
                }
            }
        } catch (error) {
            console.error('Error fetching backups:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/master/backup', {
                method: 'POST',
            });
            
            if (res.ok) {
                const data = await res.json();
                toast({
                    title: 'Backup Dimulai',
                    description: 'Backup database sedang diproses...',
                });
                // Refresh after a delay
                setTimeout(fetchBackups, 2000);
            } else {
                toast({
                    title: 'Error',
                    description: 'Gagal memulai backup',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan',
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (backupId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/master/backup/${backupId}/download`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                toast({
                    title: 'Download Selesai',
                    description: `File ${fileName} berhasil diunduh`,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal download backup',
                variant: 'destructive',
            });
        }
    };

    const handleRestore = async () => {
        if (!password) {
            toast({
                title: 'Validasi',
                description: 'Password diperlukan untuk restore',
                variant: 'destructive',
            });
            return;
        }

        setRestoring(true);
        try {
            const res = await fetch(`/api/master/backup/${confirmDialog.backupId}/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            
            if (res.ok) {
                toast({
                    title: 'Restore Berhasil',
                    description: 'Database berhasil dikembalikan',
                });
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Gagal restore',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan saat restore',
                variant: 'destructive',
            });
        } finally {
            setRestoring(false);
            setConfirmDialog({ open: false, type: 'restore' });
            setPassword('');
        }
    };

    const handleDelete = async () => {
        if (!confirmDialog.backupId) return;
        
        setDeleting(confirmDialog.backupId);
        try {
            const res = await fetch(`/api/master/backup/${confirmDialog.backupId}`, {
                method: 'DELETE',
            });
            
            if (res.ok) {
                setBackups(prev => prev.filter(b => b.id !== confirmDialog.backupId));
                toast({
                    title: 'Berhasil',
                    description: 'Backup berhasil dihapus',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal hapus backup',
                variant: 'destructive',
            });
        } finally {
            setDeleting(null);
            setConfirmDialog({ open: false, type: 'delete' });
        }
    };

    const handleSaveSchedule = async () => {
        try {
            const res = await fetch('/api/master/backup/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedule),
            });
            
            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: 'Jadwal backup berhasil disimpan',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal menyimpan jadwal',
                variant: 'destructive',
            });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
                    <p className="text-muted-foreground">
                        Kelola backup database dan restore data
                    </p>
                </div>
                <Button onClick={handleCreateBackup} disabled={creating}>
                    {creating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Database className="mr-2 h-4 w-4" />
                    )}
                    Backup Sekarang
                </Button>
            </div>

            {/* Schedule Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Jadwal Backup Otomatis
                    </CardTitle>
                    <CardDescription>
                        Konfigurasi backup otomatis menggunakan pg_cron
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Checkbox
                            id="schedule-enabled"
                            checked={schedule.enabled}
                            onCheckedChange={(checked) => 
                                setSchedule(prev => ({ ...prev, enabled: !!checked }))
                            }
                        />
                        <Label htmlFor="schedule-enabled">Aktifkan backup otomatis</Label>
                    </div>
                    
                    {schedule.enabled && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Frekuensi</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={schedule.frequency}
                                    onChange={(e) => setSchedule(prev => ({ 
                                        ...prev, 
                                        frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                                    }))}
                                >
                                    <option value="daily">Harian</option>
                                    <option value="weekly">Mingguan</option>
                                    <option value="monthly">Bulanan</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Waktu</Label>
                                <Input
                                    type="time"
                                    value={schedule.time}
                                    onChange={(e) => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                                />
                            </div>
                            {schedule.frequency === 'weekly' && (
                                <div className="space-y-2">
                                    <Label>Hari</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={schedule.day_of_week || 1}
                                        onChange={(e) => setSchedule(prev => ({ 
                                            ...prev, 
                                            day_of_week: parseInt(e.target.value)
                                        }))}
                                    >
                                        <option value={1}>Senin</option>
                                        <option value={2}>Selasa</option>
                                        <option value={3}>Rabu</option>
                                        <option value={4}>Kamis</option>
                                        <option value={5}>Jumat</option>
                                        <option value={6}>Sabtu</option>
                                        <option value={0}>Minggu</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <Button onClick={handleSaveSchedule}>
                        Simpan Jadwal
                    </Button>
                </CardContent>
            </Card>

            {/* Backup List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Riwayat Backup
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {backups.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada backup.</p>
                            <p className="text-sm">Klik "Backup Sekarang" untuk membuat backup pertama.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama File</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Ukuran</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.map((backup) => (
                                    <TableRow key={backup.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileJson className="h-4 w-4" />
                                                {backup.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(backup.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatSize(backup.size)}</TableCell>
                                        <TableCell>
                                            <Badge variant={backup.type === 'automatic' ? 'secondary' : 'outline'}>
                                                {backup.type === 'automatic' ? 'Otomatis' : 'Manual'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {backup.status === 'completed' && (
                                                <Badge variant="default" className="bg-green-500">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Selesai
                                                </Badge>
                                            )}
                                            {backup.status === 'pending' && (
                                                <Badge variant="secondary">
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    Pending
                                                </Badge>
                                            )}
                                            {backup.status === 'failed' && (
                                                <Badge variant="destructive">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Gagal
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDownload(backup.id, backup.name)}
                                                        disabled={backup.status !== 'completed'}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setConfirmDialog({ 
                                                            open: true, 
                                                            backupId: backup.id,
                                                            type: 'restore' 
                                                        })}
                                                        disabled={backup.status !== 'completed'}
                                                    >
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setConfirmDialog({ 
                                                            open: true, 
                                                            backupId: backup.id,
                                                            type: 'delete' 
                                                        })}
                                                        className="text-red-600"
                                                        disabled={deleting === backup.id}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open: boolean) => setConfirmDialog({ open, type: confirmDialog.type })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {confirmDialog.type === 'restore' ? (
                                <>
                                    <Shield className="h-5 w-5 text-orange-500" />
                                    Konfirmasi Restore
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Konfirmasi Hapus
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === 'restore' 
                                ? 'Data saat ini akan ditimpa dengan data dari backup. Pastikan Anda telah membuat backup terbaru.'
                                : 'Backup yang dihapus tidak dapat dikembalikan.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    {confirmDialog.type === 'restore' && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password Admin</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Masukkan password Anda"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: confirmDialog.type })}>
                            Batal
                        </Button>
                        {confirmDialog.type === 'restore' ? (
                            <Button 
                                variant="destructive" 
                                onClick={handleRestore}
                                disabled={restoring || !password}
                            >
                                {restoring ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                Restore
                            </Button>
                        ) : (
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete}
                                disabled={!!deleting}
                            >
                                {deleting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Hapus
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}