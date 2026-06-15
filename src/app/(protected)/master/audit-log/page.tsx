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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileText,
    Filter,
    Search,
    Shield,
    User,
    Clock,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Info,
    Loader2,
} from 'lucide-react';

interface AuditLog {
    id: string;
    created_at: string;
    table_name: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    record_id: string;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    user_id: string;
    user_email?: string;
    ip_address?: string;
}

interface AuditSummary {
    total_logs: number;
    by_action: {
        INSERT: number;
        UPDATE: number;
        DELETE: number;
    };
    by_table: Record<string, number>;
    recent_activity: {
        hour: string;
        count: number;
    }[];
}

export default function AuditLogPage() {
    const { toast } = useToast();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [summary, setSummary] = useState<AuditSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        table_name: '',
        action: '',
        user_id: '',
        date_from: '',
        date_to: '',
    });

    const limit = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (filters.search) params.set('search', filters.search);
            if (filters.table_name) params.set('table_name', filters.table_name);
            if (filters.action) params.set('action', filters.action);
            if (filters.user_id) params.set('user_id', filters.user_id);
            if (filters.date_from) params.set('date_from', filters.date_from);
            if (filters.date_to) params.set('date_to', filters.date_to);

            const res = await fetch(`/api/master/audit-log?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setSummary(data.summary || null);
                setTotalPages(data.total_pages || 1);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            table_name: '',
            action: '',
            user_id: '',
            date_from: '',
            date_to: '',
        });
        setCurrentPage(1);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'INSERT':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'DELETE':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
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

    const renderDataDiff = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
        if (!oldData && !newData) return null;

        const changes: { field: string; old?: unknown; new?: unknown }[] = [];
        const allKeys = new Set([
            ...Object.keys(oldData || {}),
            ...Object.keys(newData || {}),
        ]);

        allKeys.forEach(key => {
            const oldVal = oldData?.[key];
            const newVal = newData?.[key];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes.push({ field: key, old: oldVal, new: newVal });
            }
        });

        return (
            <div className="space-y-2">
                {changes.map((change, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                        <div className="font-medium">{change.field}</div>
                        <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
                            {change.old !== undefined ? String(change.old) : '-'}
                        </div>
                        <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
                            {change.new !== undefined ? String(change.new) : '-'}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                    <p className="text-muted-foreground">
                        Riwayat perubahan data dalam sistem
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Log</p>
                                    <p className="text-2xl font-bold">{summary.total_logs}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    INSERT
                                </Badge>
                                <p className="text-2xl font-bold">{summary.by_action.INSERT || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                    UPDATE
                                </Badge>
                                <p className="text-2xl font-bold">{summary.by_action.UPDATE || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                    DELETE
                                </Badge>
                                <p className="text-2xl font-bold">{summary.by_action.DELETE || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="h-4 w-4" />
                        Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-6">
                        <div className="space-y-2">
                            <Label>Cari</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Record ID..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tabel</Label>
                            <Select
                                value={filters.table_name}
                                onValueChange={(v: string) => handleFilterChange('table_name', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Tabel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Tabel</SelectItem>
                                    {summary && Object.keys(summary.by_table).map(table => (
                                        <SelectItem key={table} value={table}>
                                            {table} ({summary.by_table[table]})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Aksi</Label>
                            <Select
                                value={filters.action}
                                onValueChange={(v: string) => handleFilterChange('action', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Aksi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Aksi</SelectItem>
                                    <SelectItem value="INSERT">INSERT</SelectItem>
                                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Dari Tanggal</Label>
                            <Input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sampai Tanggal</Label>
                            <Input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button variant="outline" onClick={handleResetFilters}>
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Log Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Aksi</TableHead>
                                <TableHead>Tabel</TableHead>
                                <TableHead>Record ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        Tidak ada log yang ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{formatDate(log.created_at)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`${getActionColor(log.action)} font-mono text-xs`}
                                            >
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{log.table_name}</TableCell>
                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                            {log.record_id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{log.user_email || log.user_id.substring(0, 8)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                Lihat
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 5) {
                                if (currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                }
                                if (currentPage > totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                }
                            }
                            if (pageNum > totalPages) return null;
                            return (
                                <PaginationItem key={pageNum}>
                                    <PaginationLink
                                        isActive={currentPage === pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Detail Dialog */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Detail Audit Log</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)}>
                                    ×
                                </Button>
                            </div>
                            <CardDescription>
                                {formatDate(selectedLog.created_at)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Aksi</p>
                                    <Badge
                                        variant="outline"
                                        className={`${getActionColor(selectedLog.action)} font-mono mt-1`}
                                    >
                                        {selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tabel</p>
                                    <p className="font-medium">{selectedLog.table_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Record ID</p>
                                    <p className="font-mono text-sm">{selectedLog.record_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">User</p>
                                    <p>{selectedLog.user_email || selectedLog.user_id}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Perubahan Data
                                </p>
                                {renderDataDiff(selectedLog.old_data, selectedLog.new_data) || (
                                    <p className="text-sm text-muted-foreground">Tidak ada detail perubahan</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Info Note */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-800">Catatan Keamanan</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Audit log bersifat <strong>immutable</strong> (tidak dapat diubah atau dihapus).
                                Semua perubahan data tercatat dan tidak dapat dimanipulasi setelah tercatat.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}