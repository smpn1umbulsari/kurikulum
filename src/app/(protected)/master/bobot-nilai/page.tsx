'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, AlertCircle, Check, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Types
interface KomponenNilai {
    id: string;
    kode: string;
    nama: string;
    deskripsi: string;
    bobot_default: number;
    is_active: boolean;
}

interface BobotMapel {
    mapel_id: string;
    mapel_nama: string;
    uh1: number;
    uh2: number;
    uh3: number;
    uh4: number;
    uh5: number;
    pts: number;
    semester: number;
    total: number;
}

interface MapelOption {
    id: string;
    nama: string;
}

/**
 * Halaman Konfigurasi Bobot Nilai
 * 
 * Fitur:
 * - Konfigurasi bobot per mata pelajaran
 * - Validasi total bobot = 100%
 * - Default bobot untuk UH (50%), PTS (20%), Semester (30%)
 * 
 * Akses: Admin, Kurikulum
 */
export default function BobotNilaiPage() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [komponenList, setKomponenList] = useState<KomponenNilai[]>([]);
    const [mapelList, setMapelList] = useState<MapelOption[]>([]);
    const [selectedMapel, setSelectedMapel] = useState<string>('');
    const [bobotData, setBobotData] = useState<BobotMapel>({
        mapel_id: '',
        mapel_nama: '',
        uh1: 10,
        uh2: 10,
        uh3: 10,
        uh4: 10,
        uh5: 10,
        pts: 20,
        semester: 30,
        total: 100,
    });

    // Fetch komponen & mapel
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch bobot saat mapel berubah
    useEffect(() => {
        if (selectedMapel) {
            fetchBobot();
        }
    }, [selectedMapel]);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch komponen nilai
            const { data: komponen } = await supabase
                .from('komponen_nilai')
                .select('*')
                .eq('is_active', true)
                .order('kode');

            setKomponenList(komponen || []);

            // Fetch mata pelajaran
            const { data: mapel } = await supabase
                .from('mata_pelajaran')
                .select('id, nama')
                .order('nama');

            setMapelList(mapel || []);

            // Set default bobot
            setBobotData(prev => ({
                ...prev,
                uh1: 10,
                uh2: 10,
                uh3: 10,
                uh4: 10,
                uh5: 10,
                pts: 20,
                semester: 30,
            }));

        } catch (error) {
            console.error('Error fetching:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchBobot() {
        if (!selectedMapel) return;

        const mapel = mapelList.find(m => m.id === selectedMapel);

        // Fetch existing bobot from komponen_nilai per mapel (stored in another table or config)
        // For now, we'll use a simplified approach - store in localStorage or fetch from API

        const { data: existingBobot } = await supabase
            .from('pengaturan_sekolah')
            .select('value')
            .eq('key', `bobot_mapel_${selectedMapel}`)
            .single();

        if (existingBobot?.value) {
            try {
                const bobot = JSON.parse(existingBobot.value);
                setBobotData({
                    mapel_id: selectedMapel,
                    mapel_nama: mapel?.nama || '',
                    ...bobot,
                });
            } catch {
                setBobotData({
                    mapel_id: selectedMapel,
                    mapel_nama: mapel?.nama || '',
                    uh1: 10,
                    uh2: 10,
                    uh3: 10,
                    uh4: 10,
                    uh5: 10,
                    pts: 20,
                    semester: 30,
                    total: 100,
                });
            }
        } else {
            setBobotData({
                mapel_id: selectedMapel,
                mapel_nama: mapel?.nama || '',
                uh1: 10,
                uh2: 10,
                uh3: 10,
                uh4: 10,
                uh5: 10,
                pts: 20,
                semester: 30,
                total: 100,
            });
        }
    }

    function handleChange(field: keyof typeof bobotData, value: number) {
        const newData = { ...bobotData, [field]: value };

        // Recalculate total
        const total = newData.uh1 + newData.uh2 + newData.uh3 + newData.uh4 + newData.uh5 +
            newData.pts + newData.semester;
        newData.total = total;

        setBobotData(newData);
    }

    function resetToDefault() {
        setBobotData(prev => ({
            ...prev,
            uh1: 10,
            uh2: 10,
            uh3: 10,
            uh4: 10,
            uh5: 10,
            pts: 20,
            semester: 30,
            total: 100,
        }));
    }

    async function handleSave() {
        if (bobotData.total !== 100) {
            toast({
                title: 'Validasi Gagal',
                description: `Total bobot harus 100%. Saat ini: ${bobotData.total}%`,
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            const bobotConfig = {
                uh1: bobotData.uh1,
                uh2: bobotData.uh2,
                uh3: bobotData.uh3,
                uh4: bobotData.uh4,
                uh5: bobotData.uh5,
                pts: bobotData.pts,
                semester: bobotData.semester,
                total: bobotData.total,
            };

            const { error } = await supabase
                .from('pengaturan_sekolah')
                .upsert({
                    key: `bobot_mapel_${selectedMapel}`,
                    value: JSON.stringify(bobotConfig),
                    category: 'bobot_nilai',
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'key' });

            if (error) throw error;

            toast({ title: 'Berhasil', description: 'Konfigurasi bobot berhasil disimpan' });

        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: 'Error', description: 'Gagal menyimpan konfigurasi', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    }

    const isValid = bobotData.total === 100;
    const totalColor = isValid ? 'text-green-600' : 'text-red-600';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Konfigurasi Bobot Nilai</h1>
                    <p className="text-muted-foreground">
                        Atur bobot komponen nilai per mata pelajaran
                    </p>
                </div>
                {selectedMapel && (
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                    </Button>
                )}
            </div>

            {/* Info */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">Informasi:</p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                                <li>Total bobot harus sama dengan 100%</li>
                                <li>Default: UH 50% (10% x 5), PTS 20%, Semester 30%</li>
                                <li>UH1-UH5 adalah Ulangan Harian (rata-rata)</li>
                                <li>PTS adalah Penilaian Tengah Semester</li>
                                <li>Semester adalah Penilaian Akhir Semester</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Mapel */}
            <Card>
                <CardHeader>
                    <CardTitle>Pilih Mata Pelajaran</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Mata Pelajaran</Label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-background"
                                value={selectedMapel}
                                onChange={(e) => setSelectedMapel(e.target.value)}
                            >
                                <option value="">Pilih mata pelajaran...</option>
                                {mapelList.map(m => (
                                    <option key={m.id} value={m.id}>{m.nama}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bobot Config */}
            {selectedMapel && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Konfigurasi Bobot: {bobotData.mapel_nama}</CardTitle>
                                <CardDescription>
                                    Atur persentase bobot untuk setiap komponen nilai
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={resetToDefault}>
                                Reset ke Default
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(7)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* UH Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">Ulangan Harian (UH)</h3>
                                        <Badge variant="secondary">Total: {bobotData.uh1 + bobotData.uh2 + bobotData.uh3 + bobotData.uh4 + bobotData.uh5}%</Badge>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="space-y-2">
                                                <Label htmlFor={`uh${i}`}>UH {i}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id={`uh${i}`}
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={bobotData[`uh${i}` as keyof typeof bobotData]}
                                                        onChange={(e) => handleChange(`uh${i}` as keyof typeof bobotData, parseInt(e.target.value) || 0)}
                                                        className="w-20"
                                                    />
                                                    <span className="text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t" />

                                {/* PTS & Semester */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="pts">Penilaian Tengah Semester (PTS)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="pts"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={bobotData.pts}
                                                onChange={(e) => handleChange('pts', parseInt(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                            <span className="text-muted-foreground">%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="semester">Penilaian Akhir Semester</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="semester"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={bobotData.semester}
                                                onChange={(e) => handleChange('semester', parseInt(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                            <span className="text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="border-t pt-4">
                                    <div className={`flex items-center justify-between p-4 rounded-lg ${isValid ? 'bg-green-50' : 'bg-red-50'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            {isValid ? (
                                                <Check className="h-6 w-6 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-6 w-6 text-red-600" />
                                            )}
                                            <div>
                                                <p className="font-medium">Total Bobot</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {isValid
                                                        ? 'Konfigurasi valid. Siap disimpan.'
                                                        : 'Total bobot harus sama dengan 100%'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-3xl font-bold ${totalColor}`}>
                                            {bobotData.total}%
                                        </div>
                                    </div>
                                </div>

                                {/* Visual */}
                                <div className="space-y-2">
                                    <Label>Visualisasi Bobot</Label>
                                    <div className="w-full h-8 bg-muted rounded-full overflow-hidden flex">
                                        <div
                                            className="bg-blue-500 h-full"
                                            style={{ width: `${(bobotData.uh1 + bobotData.uh2 + bobotData.uh3 + bobotData.uh4 + bobotData.uh5)}%` }}
                                            title={`UH: ${bobotData.uh1 + bobotData.uh2 + bobotData.uh3 + bobotData.uh4 + bobotData.uh5}%`}
                                        />
                                        <div
                                            className="bg-yellow-500 h-full"
                                            style={{ width: `${bobotData.pts}%` }}
                                            title={`PTS: ${bobotData.pts}%`}
                                        />
                                        <div
                                            className="bg-green-500 h-full"
                                            style={{ width: `${bobotData.semester}%` }}
                                            title={`Semester: ${bobotData.semester}%`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>UH: {bobotData.uh1 + bobotData.uh2 + bobotData.uh3 + bobotData.uh4 + bobotData.uh5}%</span>
                                        <span>PTS: {bobotData.pts}%</span>
                                        <span>Semester: {bobotData.semester}%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Legend */}
            {!selectedMapel && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Pilih mata pelajaran untuk mengatur konfigurasi bobot nilai
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}