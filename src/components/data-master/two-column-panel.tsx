'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface TwoColumnItem {
  id: string;
  name: string;
  secondary?: string;
  metadata?: Record<string, unknown>;
}

export interface TwoColumnPanelProps {
  /** Data items that are NOT yet assigned (right column) */
  unassignedItems: TwoColumnItem[];
  /** Data items that ARE assigned (left column) */
  assignedItems: TwoColumnItem[];
  /** Callback when items are moved to assigned */
  onAssign?: (itemIds: string[]) => void;
  /** Callback when items are moved back to unassigned */
  onUnassign?: (itemIds: string[]) => void;
  /** Callback when save is triggered */
  onSave?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Save button loading state */
  isSaving?: boolean;
  /** Left column title */
  leftTitle?: string;
  /** Right column title */
  rightTitle?: string;
  /** Item renderer for custom display */
  renderItem?: (item: TwoColumnItem, source: 'assigned' | 'unassigned') => React.ReactNode;
  /** Maximum selections allowed */
  maxSelections?: number;
  className?: string;
}

export function TwoColumnPanel({
  unassignedItems,
  assignedItems,
  onAssign,
  onUnassign,
  onSave,
  isLoading = false,
  isSaving = false,
  leftTitle = 'Dipilih',
  rightTitle = 'Tersedia',
  renderItem,
  maxSelections,
  className,
}: TwoColumnPanelProps) {
  const [selectedUnassigned, setSelectedUnassigned] = useState<Set<string>>(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set());
  const [searchUnassigned, setSearchUnassigned] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');

  // Filter items based on search
  const filteredUnassigned = unassignedItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchUnassigned.toLowerCase()) ||
      item.secondary?.toLowerCase().includes(searchUnassigned.toLowerCase())
  );

  const filteredAssigned = assignedItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchAssigned.toLowerCase()) ||
      item.secondary?.toLowerCase().includes(searchAssigned.toLowerCase())
  );

  // Handle selection toggle
  const toggleUnassignedSelection = useCallback((id: string) => {
    setSelectedUnassigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Check max selections
        if (maxSelections && next.size >= maxSelections) {
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }, [maxSelections]);

  const toggleAssignedSelection = useCallback((id: string) => {
    setSelectedAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (maxSelections && next.size >= maxSelections) {
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }, [maxSelections]);

  // Handle move between columns
  const handleMoveToAssigned = useCallback(() => {
    if (selectedUnassigned.size > 0 && onAssign) {
      onAssign(Array.from(selectedUnassigned));
      setSelectedUnassigned(new Set());
    }
  }, [selectedUnassigned, onAssign]);

  const handleMoveToUnassigned = useCallback(() => {
    if (selectedAssigned.size > 0 && onUnassign) {
      onUnassign(Array.from(selectedAssigned));
      setSelectedAssigned(new Set());
    }
  }, [selectedAssigned, onUnassign]);

  // Handle select all visible
  const handleSelectAllUnassigned = useCallback(() => {
    if (maxSelections) {
      setSelectedUnassigned(new Set(filteredUnassigned.slice(0, maxSelections).map((i) => i.id)));
    } else {
      setSelectedUnassigned(new Set(filteredUnassigned.map((i) => i.id)));
    }
  }, [filteredUnassigned, maxSelections]);

  const handleSelectAllAssigned = useCallback(() => {
    if (maxSelections) {
      setSelectedAssigned(new Set(filteredAssigned.slice(0, maxSelections).map((i) => i.id)));
    } else {
      setSelectedAssigned(new Set(filteredAssigned.map((i) => i.id)));
    }
  }, [filteredAssigned, maxSelections]);

  // Clear selections
  const handleClearUnassigned = useCallback(() => {
    setSelectedUnassigned(new Set());
  }, []);

  const handleClearAssigned = useCallback(() => {
    setSelectedAssigned(new Set());
  }, []);

  // Default item renderer
  const defaultRenderItem = (item: TwoColumnItem, source: 'assigned' | 'unassigned') => (
    <div className="flex flex-col">
      <span className="font-medium">{item.name}</span>
      {item.secondary && (
        <span className="text-sm text-muted-foreground">{item.secondary}</span>
      )}
      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <span className="text-xs text-muted-foreground mt-1">
          {Object.entries(item.metadata)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(' | ')}
        </span>
      )}
    </div>
  );

  const ItemRenderer = renderItem || defaultRenderItem;

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - Assigned */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{leftTitle}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {assignedItems.length} item
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Search & Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  value={searchAssigned}
                  onChange={(e) => setSearchAssigned(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllAssigned}
                disabled={filteredAssigned.length === 0}
              >
                Pilih Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAssigned}
                disabled={selectedAssigned.size === 0}
              >
                Batal
              </Button>
            </div>

            {/* Item List */}
            <ScrollArea className="flex-1 h-[300px] md:h-[400px]">
              <div className="space-y-2 pr-4">
                {filteredAssigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {assignedItems.length === 0
                      ? 'Belum ada item'
                      : 'Tidak ada hasil pencarian'}
                  </p>
                ) : (
                  filteredAssigned.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleAssignedSelection(item.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedAssigned.has(item.id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background hover:bg-muted/50 border-border'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          selectedAssigned.has(item.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {selectedAssigned.has(item.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {ItemRenderer(item, 'assigned')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Move Back Button */}
            <Button
              variant="destructive"
              onClick={handleMoveToUnassigned}
              disabled={selectedAssigned.size === 0}
              className="mt-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Hapus {selectedAssigned.size > 0 && `(${selectedAssigned.size})`}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Unassigned */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{rightTitle}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {unassignedItems.length} item
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Search & Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  value={searchUnassigned}
                  onChange={(e) => setSearchUnassigned(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllUnassigned}
                disabled={filteredUnassigned.length === 0}
              >
                Pilih Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearUnassigned}
                disabled={selectedUnassigned.size === 0}
              >
                Batal
              </Button>
            </div>

            {/* Item List */}
            <ScrollArea className="flex-1 h-[300px] md:h-[400px]">
              <div className="space-y-2 pr-4">
                {filteredUnassigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {unassignedItems.length === 0
                      ? 'Semua item sudah dipilih'
                      : 'Tidak ada hasil pencarian'}
                  </p>
                ) : (
                  filteredUnassigned.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleUnassignedSelection(item.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedUnassigned.has(item.id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background hover:bg-muted/50 border-border'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          selectedUnassigned.has(item.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {selectedUnassigned.has(item.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {ItemRenderer(item, 'unassigned')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Move to Assigned Button */}
            <Button
              onClick={handleMoveToAssigned}
              disabled={selectedUnassigned.size === 0}
              className="mt-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              Pilih {selectedUnassigned.size > 0 && `(${selectedUnassigned.size})`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default TwoColumnPanel;
