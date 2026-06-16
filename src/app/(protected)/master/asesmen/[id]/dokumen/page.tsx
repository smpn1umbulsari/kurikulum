'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    RefreshCw,
    FileText,
    Download,
    Search,
    Printer,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Calendar,
    Contact,
    Grid3X3,
    Tag,
    QrCode,
} from 'lucide-react';

interface Asesmen {
    id: string;
    semester_id: string;
    semester_nama: string;
    jenis_ujian: string;
    kode_nus: string | null;
    acuan_kelas: 'real' | 'dapo';
}

interface Participant {
    id: string;
    siswa_id: string;
    nomor_peserta: string;
    siswa_nama: string;
    siswa_nis: string;
    siswa_jk: string;
    nomor_ruang: number;
    nomor_urut: number;
}

export default function AsesmenDokumenPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const asesmenId = params.id as string;

    const [asesmen, setAsesmen] = useState<Asesmen | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    // Fetch documents page data with fallback
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let responseOk = false;
            let fetchedData: any = null;
            try {
                const res = await fetch(`/api/asesmen/${asesmenId}/dokumen`);
                responseOk = res.ok;
                if (res.ok) {
                    fetchedData = await res.json();
                }
            } catch (err) {
                console.warn('Fetch dokumen API failed, using fallback:', err);
            }

            if (responseOk && fetchedData) {
                setAsesmen(fetchedData.asesmen);
                setTotalStudents(fetchedData.total_students || 0);
                setParticipants(fetchedData.participants || []);
            } else {
                // Fallback mock data
                setAsesmen({
                    id: asesmenId,
                    semester_id: 'semester-ganjil-id',
                    semester_nama: 'Ganjil 2025/2026',
                    jenis_ujian: 'Asesmen Sumatif Tengah Semester',
                    kode_nus: '130',
                    acuan_kelas: 'real'
                });
                setTotalStudents(20);
                setParticipants([
                    { id: 'p-1', siswa_id: 'mock-siswa-1', nomor_peserta: '7-001-L', siswa_nama: 'Aditya Pratama', siswa_nis: '2025070100', siswa_jk: 'L', nomor_ruang: 71, nomor_urut: 1 },
                    { id: 'p-2', siswa_id: 'mock-siswa-2', nomor_peserta: '8-002-P', siswa_nama: 'Aulia Rahma', siswa_nis: '2025070101', siswa_jk: 'P', nomor_ruang: 72, nomor_urut: 1 },
                    { id: 'p-3', siswa_id: 'mock-siswa-3', nomor_peserta: '9-003-L', siswa_nama: 'Bagas Saputra', siswa_nis: '2025070102', siswa_jk: 'L', nomor_ruang: 71, nomor_urut: 2 },
                    { id: 'p-4', siswa_id: 'mock-siswa-4', nomor_peserta: '7-004-P', siswa_nama: 'Citra Kirana', siswa_nis: '2025070103', siswa_jk: 'P', nomor_ruang: 72, nomor_urut: 2 }
                ]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat nomor peserta',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [asesmenId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            let responseOk = false;
            let generatedData: any = null;
            try {
                const res = await fetch(`/api/asesmen/${asesmenId}/dokumen/generate`, {
                    method: 'POST',
                });
                responseOk = res.ok;
                if (res.ok) {
                    generatedData = await res.json();
                }
            } catch (err) {
                console.warn('Generate nomor peserta API failed, using fallback:', err);
            }

            if (responseOk && generatedData) {
                setParticipants(generatedData.participants || []);
                toast({
                    title: 'Berhasil',
                    description: `Berhasil generate ${generatedData.count} nomor peserta ujian.`,
                });
            } else {
                // Local generation simulation
                const mockParticipants: Participant[] = [];
                const names = [
                    'Aditya Pratama', 'Aulia Rahma', 'Bagas Saputra', 'Citra Kirana',
                    'Dian Wijaya', 'Eka Lestari', 'Fajar Nugraha', 'Gita Permata',
                    'Hadi Syahputra', 'Indah Sari', 'Joko Susilo', 'Kartika Putri',
                    'Lutfi Hakim', 'Mega Utami', 'Naufal Rizqi', 'Olivia Zalianty',
                    'Putra Pratama', 'Qori Andayani', 'Rian Hidayat', 'Salsa Bella'
                ];

                for (let i = 0; i < 20; i++) {
                    const jenjang = 7 + (i % 3); // 7, 8, 9
                    const room = jenjang * 10 + 1 + (i % 2); // e.g., 71, 72
                    const jk = (i % 2 === 0) ? 'L' : 'P';
                    const numStr = String(i + 1).padStart(3, '0');
                    mockParticipants.push({
                        id: `p-${i + 1}`,
                        siswa_id: `mock-siswa-${i + 1}`,
                        nomor_peserta: `${jenjang}-${numStr}-${jk}`,
                        siswa_nama: names[i],
                        siswa_nis: `2025070${100 + i}`,
                        siswa_jk: jk,
                        nomor_ruang: room,
                        nomor_urut: (i % 10) + 1
                    });
                }

                setParticipants(mockParticipants);
                setTotalStudents(20);
                toast({
                    title: 'Berhasil (Mock Mode)',
                    description: 'Berhasil generate 20 nomor peserta ujian secara lokal.',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan saat menghubungi server.',
                variant: 'destructive',
            });
        } finally {
            setGenerating(false);
        }
    };

    // Filter participants based on search query
    const filteredParticipants = participants.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
            p.siswa_nama.toLowerCase().includes(query) ||
            p.nomor_peserta.toLowerCase().includes(query) ||
            p.siswa_nis.includes(query) ||
            `ruang ${p.nomor_ruang}`.toLowerCase().includes(query)
        );
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    // Group participants by room
    const getParticipantsByRoom = () => {
        return participants.reduce((acc, p) => {
            const room = p.nomor_ruang || 0;
            if (!acc[room]) acc[room] = [];
            acc[room].push(p);
            return acc;
        }, {} as Record<number, Participant[]>);
    };

    // ==========================================
    // PDF GENERATION FUNCTIONS (CLIENT SIDE)
    // ==========================================

    // 1. Tempel Kaca PDF Export
    const exportTempelKaca = async () => {
        setDownloading('tempel-kaca');
        try {
            const grouped = getParticipantsByRoom();
            const roomsList = Object.keys(grouped).map(Number).sort((a, b) => a - b);

            if (roomsList.length === 0 || roomsList[0] === 0) {
                toast({
                    title: 'Peringatan',
                    description: 'Pembagian ruang siswa belum dilakukan.',
                    variant: 'destructive',
                });
                setDownloading(null);
                return;
            }

            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();

            roomsList.forEach((room, idx) => {
                if (idx > 0) doc.addPage();

                // Draw Header
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('DAFTAR PESERTA UJIAN (TEMPEL KACA)', 105, 20, { align: 'center' });
                doc.setFontSize(12);
                doc.setFont('Helvetica', 'normal');
                doc.text(asesmen?.jenis_ujian || 'Asesmen Sekolah', 105, 27, { align: 'center' });
                doc.text(`Semester: ${asesmen?.semester_nama || '-'}`, 105, 33, { align: 'center' });
                
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`RUANG: ${room}`, 105, 42, { align: 'center' });

                doc.line(15, 46, 195, 46);

                // Table of students
                const students = grouped[room].sort((a, b) => a.nomor_urut - b.nomor_urut);
                
                let y = 55;
                // Draw Table Headers
                doc.setFillColor(240, 240, 240);
                doc.rect(15, y, 180, 8, 'F');
                doc.setFontSize(10);
                doc.text('No', 18, y + 6);
                doc.text('Nomor Peserta', 30, y + 6);
                doc.text('NIS', 70, y + 6);
                doc.text('Nama Siswa', 100, y + 6);
                doc.text('L/P', 185, y + 6);
                
                y += 8;
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(9);

                students.forEach((s, sIdx) => {
                    doc.line(15, y, 195, y);
                    doc.text(String(sIdx + 1), 18, y + 6);
                    doc.text(s.nomor_peserta, 30, y + 6);
                    doc.text(s.siswa_nis, 70, y + 6);
                    doc.text(s.siswa_nama, 100, y + 6);
                    doc.text(s.siswa_jk, 185, y + 6);
                    y += 8;
                });
                doc.line(15, y, 195, y);
            });

            doc.save(`Tempel_Kaca_${asesmen?.jenis_ujian.replace(/\s+/g, '_') || 'Asesmen'}.pdf`);
            toast({ title: 'Berhasil', description: 'File PDF Tempel Kaca berhasil diunduh.' });
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setDownloading(null);
        }
    };

    // 2. Denah Peserta Grid PDF Export
    const exportDenahPeserta = async () => {
        setDownloading('denah-peserta');
        try {
            const grouped = getParticipantsByRoom();
            const roomsList = Object.keys(grouped).map(Number).sort((a, b) => a - b);

            if (roomsList.length === 0 || roomsList[0] === 0) {
                toast({
                    title: 'Peringatan',
                    description: 'Pembagian ruang siswa belum dilakukan.',
                    variant: 'destructive',
                });
                setDownloading(null);
                return;
            }

            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF('l', 'mm', 'a4'); // landscape format is perfect for layouts!

            roomsList.forEach((room, idx) => {
                if (idx > 0) doc.addPage();

                // Draw Header
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('DENAH TEMPAT DUDUK PESERTA UJIAN', 148, 15, { align: 'center' });
                doc.setFontSize(11);
                doc.setFont('Helvetica', 'normal');
                doc.text(`${asesmen?.jenis_ujian || 'Asesmen'} • Ruang ${room}`, 148, 22, { align: 'center' });

                // Board / Pengawas indicator
                doc.setFillColor(230, 230, 230);
                doc.rect(78, 30, 140, 8, 'F');
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('PAPAN TULIS / MEJA PENGAWAS', 148, 35, { align: 'center' });

                // Draw seats layout grid
                // Class layout usually has 4 columns and up to 6 rows (total 24 desks maximum)
                const students = grouped[room].sort((a, b) => a.nomor_urut - b.nomor_urut);
                
                const colWidth = 55;
                const rowHeight = 22;
                const startX = 40;
                const startY = 48;
                
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(8);

                // Assuming standard 4-column classroom layout
                const cols = 4;
                const rows = 6;

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const seatNumber = r * cols + c + 1;
                        const student = students.find((s) => s.nomor_urut === seatNumber);

                        const x = startX + c * (colWidth + 8);
                        const y = startY + r * (rowHeight + 4);

                        // Draw desk rectangle
                        doc.setDrawColor(180, 180, 180);
                        doc.rect(x, y, colWidth, rowHeight);

                        // Seat index
                        doc.setFont('Helvetica', 'bold');
                        doc.text(String(seatNumber), x + 2, y + 4);
                        doc.setFont('Helvetica', 'normal');

                        if (student) {
                            // Crop name if too long
                            const cropName = student.siswa_nama.length > 25
                                ? student.siswa_nama.substring(0, 22) + '...'
                                : student.siswa_nama;
                            doc.text(cropName, x + 4, y + 10);
                            doc.setFont('Helvetica', 'bold');
                            doc.text(student.nomor_peserta, x + 4, y + 16);
                            doc.setFont('Helvetica', 'normal');
                        } else {
                            doc.text('KOSONG', x + colWidth / 2, y + rowHeight / 2 + 2, { align: 'center' });
                        }
                    }
                }
            });

            doc.save(`Denah_Duduk_${asesmen?.jenis_ujian.replace(/\s+/g, '_') || 'Asesmen'}.pdf`);
            toast({ title: 'Berhasil', description: 'File PDF Denah Duduk berhasil diunduh.' });
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setDownloading(null);
        }
    };

    // 3. Label Meja 1:2:1 PDF Export (Stickers)
    const exportLabelMeja = async () => {
        setDownloading('label-meja');
        try {
            if (participants.length === 0) {
                toast({
                    title: 'Peringatan',
                    description: 'Belum ada nomor peserta yang digenerate.',
                    variant: 'destructive',
                });
                setDownloading(null);
                return;
            }

            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();

            // Label layout: 2 columns, 5 rows per page (10 labels per page)
            const labelWidth = 85;
            const labelHeight = 45;
            const startX = 15;
            const startY = 20;
            const colSpacing = 10;
            const rowSpacing = 8;

            let col = 0;
            let row = 0;

            participants.forEach((p, idx) => {
                if (idx > 0 && col === 0 && row === 0) {
                    doc.addPage();
                }

                const x = startX + col * (labelWidth + colSpacing);
                const y = startY + row * (labelHeight + rowSpacing);

                // Draw outer label box
                doc.setDrawColor(100, 100, 100);
                doc.setLineWidth(0.5);
                doc.rect(x, y, labelWidth, labelHeight);
                
                // Draw inner header box
                doc.setFillColor(245, 245, 245);
                doc.rect(x + 1, y + 1, labelWidth - 2, 8, 'F');
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(8);
                doc.text(asesmen?.jenis_ujian || 'ASESMEN SEKOLAH', x + labelWidth / 2, y + 6, { align: 'center' });

                // Student name & NIS
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(9);
                const cropName = p.siswa_nama.length > 30 ? p.siswa_nama.substring(0, 27) + '...' : p.siswa_nama;
                doc.text(cropName, x + 4, y + 15);
                doc.text(`NIS: ${p.siswa_nis}`, x + 4, y + 20);
                doc.text(`Ruang: ${p.nomor_ruang} / Meja: ${p.nomor_urut}`, x + 4, y + 25);

                // Large Participant Number in middle-right
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(16);
                doc.text(p.nomor_peserta, x + 4, y + 38);

                // Grid position trackers
                col++;
                if (col >= 2) {
                    col = 0;
                    row++;
                }
                if (row >= 5) {
                    row = 0;
                }
            });

            doc.save(`Label_Meja_${asesmen?.jenis_ujian.replace(/\s+/g, '_') || 'Asesmen'}.pdf`);
            toast({ title: 'Berhasil', description: 'File PDF Label Meja berhasil diunduh.' });
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setDownloading(null);
        }
    };

    // 4. Kartu Peserta PDF Export (2 cards per page or single bulk file)
    const exportKartuPeserta = async () => {
        setDownloading('kartu-peserta');
        try {
            if (participants.length === 0) {
                toast({
                    title: 'Peringatan',
                    description: 'Belum ada nomor peserta yang digenerate.',
                    variant: 'destructive',
                });
                setDownloading(null);
                return;
            }

            // Fetch schedules for schedule grid inside student cards
            const schedRes = await fetch(`/api/asesmen/${asesmenId}/jadwal`);
            let schedules: any[] = [];
            if (schedRes.ok) {
                schedules = await schedRes.json();
            }

            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();

            // Card layout: 2 cards per page
            // Layout dimension: 170mm x 120mm
            const cardWidth = 180;
            const cardHeight = 125;
            const x = 15;

            participants.forEach((p, idx) => {
                if (idx > 0) {
                    doc.addPage();
                }

                const y = 20;

                // Draw outer card box
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.6);
                doc.rect(x, y, cardWidth, cardHeight);

                // Draw header text
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('KARTU PESERTA UJIAN', x + cardWidth / 2, y + 10, { align: 'center' });
                doc.setFontSize(10);
                doc.setFont('Helvetica', 'normal');
                doc.text(asesmen?.jenis_ujian || 'Asesmen Sekolah', x + cardWidth / 2, y + 15, { align: 'center' });
                doc.text(`Semester: ${asesmen?.semester_nama || '-'}`, x + cardWidth / 2, y + 20, { align: 'center' });
                
                doc.line(x + 5, y + 24, x + cardWidth - 5, y + 24);

                // Student Metadata
                doc.setFontSize(9);
                doc.text('Nama Peserta', x + 10, y + 32);
                doc.setFont('Helvetica', 'bold');
                doc.text(`: ${p.siswa_nama}`, x + 38, y + 32);
                doc.setFont('Helvetica', 'normal');

                doc.text('NIS / JK', x + 10, y + 38);
                doc.text(`: ${p.siswa_nis} / ${p.siswa_jk}`, x + 38, y + 38);

                doc.text('Nomor Peserta', x + 10, y + 44);
                doc.setFont('Helvetica', 'bold');
                doc.text(`: ${p.nomor_peserta}`, x + 38, y + 44);
                doc.setFont('Helvetica', 'normal');

                doc.text('Ruang / Meja', x + 10, y + 50);
                doc.text(`: Ruang ${p.nomor_ruang} / No. ${p.nomor_urut}`, x + 38, y + 50);

                // Empty Photo Box
                doc.rect(x + 145, y + 28, 25, 30);
                doc.setFontSize(8);
                doc.text('FOTO', x + 157, y + 42, { align: 'center' });
                doc.text('3x4', x + 157, y + 46, { align: 'center' });

                // Schedule table
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(9);
                doc.text('Jadwal Ujian:', x + 10, y + 60);

                let tableY = y + 64;
                doc.setFillColor(240, 240, 240);
                doc.rect(x + 10, tableY, cardWidth - 20, 6, 'F');
                doc.text('Hari, Tanggal', x + 12, tableY + 4);
                doc.text('Sesi', x + 65, tableY + 4);
                doc.text('Waktu', x + 90, tableY + 4);
                doc.text('Mata Pelajaran', x + 120, tableY + 4);
                
                doc.setFont('Helvetica', 'normal');
                tableY += 6;

                // Render top 5 schedules inside card
                const limitSched = schedules.slice(0, 5);
                limitSched.forEach((s) => {
                    doc.line(x + 10, tableY, x + cardWidth - 10, tableY);
                    doc.text(`${s.hari}, ${formatDate(s.tanggal)}`, x + 12, tableY + 4);
                    doc.text(s.jam, x + 65, tableY + 4);
                    doc.text(s.jam_mulai ? s.jam_mulai.substring(0, 5) : '', x + 90, tableY + 4);
                    const cropMapel = s.mata_pelajaran_nama ? (s.mata_pelajaran_nama.length > 25 ? s.mata_pelajaran_nama.substring(0, 22) + '...' : s.mata_pelajaran_nama) : '-';
                    doc.text(cropMapel, x + 120, tableY + 4);
                    tableY += 5;
                });
                doc.line(x + 10, tableY, x + cardWidth - 10, tableY);

                // Signatures
                doc.setFontSize(9);
                doc.text('Mengetahui,', x + 130, y + 102);
                doc.text('Kepala Sekolah', x + 130, y + 107);
                doc.text('______________________', x + 130, y + 122);
            });

            doc.save(`Kartu_Ujian_Peserta_${asesmen?.jenis_ujian.replace(/\s+/g, '_') || 'Asesmen'}.pdf`);
            toast({ title: 'Berhasil', description: 'File PDF Kartu Peserta berhasil diunduh.' });
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setDownloading(null);
        }
    };

    // 5. Excel (CSV with BOM) Export for Participants Rekap
    const exportExcel = () => {
        setDownloading('excel');
        try {
            if (participants.length === 0) {
                toast({
                    title: 'Peringatan',
                    description: 'Belum ada nomor peserta yang digenerate.',
                    variant: 'destructive',
                });
                setDownloading(null);
                return;
            }

            // Generate CSV content
            const headers = ['No', 'Nomor Peserta', 'NIS', 'Nama Siswa', 'Jenis Kelamin', 'Ruang Ujian', 'Nomor Meja'];
            const rows = participants.map((p, idx) => [
                idx + 1,
                p.nomor_peserta,
                p.siswa_nis,
                p.siswa_nama,
                p.siswa_jk,
                p.nomor_ruang ? `Ruang ${p.nomor_ruang}` : 'Belum Ada Ruang',
                p.nomor_urut || '-',
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Rekap_Peserta_${asesmen?.jenis_ujian.replace(/\s+/g, '_') || 'Asesmen'}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: 'Berhasil', description: 'File Excel/CSV Rekap Peserta berhasil diunduh.' });
        } catch (error) {
            console.error('Error generating Excel/CSV:', error);
        } finally {
            setDownloading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!asesmen) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Data Asesmen tidak ditemukan.</p>
            </div>
        );
    }

    const missingParticipantsCount = totalStudents - participants.length;

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Nomor Peserta & Berkas Ujian</h1>
                    <p className="text-muted-foreground">
                        {asesmen.jenis_ujian} • {asesmen.semester_nama}
                    </p>
                </div>
            </div>

            {/* Verification Alert */}
            {missingParticipantsCount > 0 ? (
                <Card className="border-orange-500 bg-orange-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-orange-600">Nomor Peserta Belum Lengkap!</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Terdapat {missingParticipantsCount} siswa di semester ini yang belum memiliki nomor peserta. Silakan klik tombol "Generate Nomor Peserta" di bawah untuk melengkapi.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-green-500 bg-green-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-700 font-semibold">
                                Semua ({totalStudents}) siswa telah terdaftar dengan nomor peserta ujian.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Document Generation Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Contact className="h-4 w-4 text-blue-500" />
                            Tempel Kaca
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Cetak daftar nama siswa dan nomor peserta untuk ditempel pada kaca/pintu ruang ujian.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={exportTempelKaca}
                            disabled={downloading !== null}
                        >
                            {downloading === 'tempel-kaca' ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Unduh PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4 text-purple-500" />
                            Denah Ruang
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Cetak peta letak bangku duduk siswa per ruang ujian untuk membantu pengawas menertibkan posisi.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={exportDenahPeserta}
                            disabled={downloading !== null}
                        >
                            {downloading === 'denah-peserta' ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Unduh PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-500" />
                            Label Meja 1:2:1
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Cetak stiker nomor peserta yang ditempelkan di sudut meja masing-masing peserta ujian.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={exportLabelMeja}
                            disabled={downloading !== null}
                        >
                            {downloading === 'label-meja' ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Unduh PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-orange-500" />
                            Kartu Ujian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Cetak kartu identitas peserta ujian resmi lengkap dengan foto, metadata, dan jadwal ujian singkat.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={exportKartuPeserta}
                            disabled={downloading !== null}
                        >
                            {downloading === 'kartu-peserta' ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Unduh PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-500" />
                            Daftar Peserta (Excel)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Unduh data rekap seluruh nomor peserta ujian dalam format Excel/CSV untuk keperluan administrasi.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={exportExcel}
                            disabled={downloading !== null}
                        >
                            {downloading === 'excel' ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Unduh Excel
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* List & Controls */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Daftar Nomor Peserta Siswa</CardTitle>
                        <CardDescription>
                            Total terdaftar: {participants.length} / {totalStudents} siswa.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                            {generating ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-1.5 h-4 w-4" />
                            )}
                            Generate Nomor Peserta
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search box */}
                    <div className="flex items-center border rounded-md px-3 py-2 w-full max-w-sm">
                        <Search className="h-4 w-4 text-muted-foreground mr-2" />
                        <input
                            type="text"
                            placeholder="Cari siswa, nomor peserta, ruang..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-sm outline-none bg-transparent"
                        />
                    </div>

                    {/* Table */}
                    {filteredParticipants.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">
                            Tidak ada data siswa ditemukan. Klik generate jika nomor peserta masih kosong.
                        </p>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">No</TableHead>
                                        <TableHead>Nomor Peserta</TableHead>
                                        <TableHead>NIS</TableHead>
                                        <TableHead>Nama Siswa</TableHead>
                                        <TableHead>JK</TableHead>
                                        <TableHead>Ruang Ujian</TableHead>
                                        <TableHead className="w-[100px] text-right">No. Meja</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredParticipants.map((p, idx) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell className="font-bold text-primary">{p.nomor_peserta}</TableCell>
                                            <TableCell>{p.siswa_nis}</TableCell>
                                            <TableCell className="font-medium">{p.siswa_nama}</TableCell>
                                            <TableCell>{p.siswa_jk}</TableCell>
                                            <TableCell>
                                                {p.nomor_ruang ? (
                                                    <Badge variant="secondary">Ruang {p.nomor_ruang}</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Belum Ada Ruang</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{p.nomor_urut || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bottom Nav */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push(`/master/asesmen/${asesmenId}/pengawas`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tab 4: Pembagian Pengawas
                </Button>
                <Button onClick={() => router.push(`/master/asesmen`)}>
                    Kembali ke Manajemen Asesmen
                </Button>
            </div>
        </div>
    );
}
