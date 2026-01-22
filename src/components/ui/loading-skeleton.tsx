import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
    variant?: 'card' | 'list' | 'table' | 'text';
    count?: number;
    className?: string;
}

export default function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    if (variant === 'card') {
        return (
            <>
                {skeletons.map((i) => (
                    <div key={i} className={cn('glass-card rounded-xl p-6 animate-pulse', className)}>
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-muted animate-shimmer" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-muted rounded animate-shimmer w-3/4" />
                                <div className="h-3 bg-muted rounded animate-shimmer w-1/2" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="h-3 bg-muted rounded animate-shimmer" />
                            <div className="h-3 bg-muted rounded animate-shimmer w-5/6" />
                        </div>
                    </div>
                ))}
            </>
        );
    }

    if (variant === 'list') {
        return (
            <div className={cn('space-y-3', className)}>
                {skeletons.map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted animate-shimmer" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded animate-shimmer w-1/3" />
                            <div className="h-2 bg-muted rounded animate-shimmer w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={cn('space-y-2', className)}>
                {skeletons.map((i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                        <div className="h-3 bg-muted rounded animate-shimmer" />
                        <div className="h-3 bg-muted rounded animate-shimmer" />
                        <div className="h-3 bg-muted rounded animate-shimmer" />
                        <div className="h-3 bg-muted rounded animate-shimmer" />
                    </div>
                ))}
            </div>
        );
    }

    // text variant
    return (
        <div className={cn('space-y-2', className)}>
            {skeletons.map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-shimmer" />
            ))}
        </div>
    );
}
