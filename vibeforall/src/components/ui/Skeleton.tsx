import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-gray-200 rounded-2xl animate-pulse', className)} />
  );
}

export function MissionCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-2xl" />
        <Skeleton className="h-10 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}
