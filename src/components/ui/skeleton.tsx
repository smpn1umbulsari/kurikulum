import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 * 
 * Komponen untuk menampilkan loading state dengan animasi pulse.
 */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-muted', className)}
            {...props}
        />
    );
}

export { Skeleton };