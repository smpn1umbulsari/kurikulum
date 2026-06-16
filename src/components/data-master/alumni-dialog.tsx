'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, RotateCcw } from 'lucide-react';
import { SiswaWithRelations } from '@/types/database';

interface AlumniDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    siswa: SiswaWithRelations | null;
    onConfirm: (tahunLulus: number | undefined) => Promise<void>;
    onRevert?: () => Promise<void>;
    isProcessing: boolean;
}

export function AlumniDialog({
    open,
    onOpenChange,
    siswa,
    onConfirm,
    onRevert,
    isProcessing,
}: AlumniDialogProps) {
    const [tahunLulus, setTahunLulus] = useState<number | undefined>(undefined);
    const currentYear = new Date().getFullYear();

    // Generate year options (current year down to 2000)
    const tahunOptions = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

    useEffect(() => {
        if (siswa && siswa.status_siswa === 'alumni') {
            setTahunLulus(siswa.tahun_lulus || undefined);
        } else {
            setTahunLulus(currentYear);
        }
    }, [siswa, currentYear]);

    if (!siswa) return null;

    const isAlumni = siswa.status_siswa === 'alumni';

    const handleConfirm = async () => {
        await onConfirm(tahunLulus);
        if (!isProcessing) {
            onOpenChange(false);
        }
    };

    const handleRevert = async () => {
        if (onRevert) {
            await onRevert();
            if (!isProcessing) {
                onOpenChange(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isAlumni ? (
                            <>
                                <RotateCcw className="h-5 w-5 text-amber-600" />
                                Batalkan Status Alumni
                            </>
                        ) : (
                            <>
                                <Award className="h-5 w-5 text-amber-600" />
                                Jadikan Alumni
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isAlumni
                            ? `Batalkan status alumni untuk ${siswa.nama}?`
                            : `Ubah status ${siswa.nama} menjadi alumni.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Student Info */}
                    <div className="rounded-lg bg-muted p-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Nama:</span>
                                <p className="font-medium">{siswa.nama}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">NIS:</span>
                                <p className="font-mono">{siswa.nis}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">NISN:</span>
                                <p className="font-mono">{siswa.nisn || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Jenjang:</span>
                                <p className="font-medium">{siswa.jenjang || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {!isAlumni && (
                        <div className="grid gap-2">
                            <Label htmlFor="tahunLulus">Tahun Lulus</Label>
                            <select
                                id="tahunLulus"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={tahunLulus || currentYear}
                                onChange={(e) => setTahunLulus(Number(e.target.value))}
                            >
                                <option value={currentYear}>{currentYear} (Tahun ini)</option>
                                {tahunOptions
                                    .filter((t) => t !== currentYear)
                                    .map((tahun) => (
                                        <option key={tahun} value={tahun}>
                                            {tahun}
                                        </option>
                                    ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Tahun lulus akan diisi otomatis ke {tahunLulus || currentYear}
                            </p>
                        </div>
                    )}

                    {isAlumni && siswa.tahun_lulus && (
                        <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">Tahun Lulus:</span> {siswa.tahun_lulus}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Batal
                    </Button>
                    {isAlumni ? (
                        <Button
                            onClick={handleRevert}
                            disabled={isProcessing}
                            variant="outline"
                            className="text-amber-600 hover:text-amber-700"
                        >
                            {isProcessing ? 'Memproses...' : 'Batalkan Alumni'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isProcessing ? 'Memproses...' : 'Jadikan Alumni'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AlumniDialog;
