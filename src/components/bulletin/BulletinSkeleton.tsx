import { Skeleton } from '@/components/ui/skeleton';

export const BulletinSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <div className="px-5 pt-8 pb-4 lg:px-8 lg:pt-12 lg:pb-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-64 mt-3" />
    </div>

    {/* Gain cumulé */}
    <div className="mx-5 lg:mx-8">
      <div className="bg-card rounded-2xl border border-border p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-48 mt-2" />
        <Skeleton className="h-4 w-24 mt-2" />
        <Skeleton className="h-4 w-36 mt-3" />
      </div>
    </div>

    {/* Action du jour */}
    <div className="mx-5 lg:mx-8 mt-4">
      <div className="bg-primary/10 rounded-2xl p-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-28 mt-4" />
        <Skeleton className="h-8 w-full mt-2" />
        <Skeleton className="h-4 w-3/4 mt-3" />
        <Skeleton className="h-12 w-full mt-6 rounded-xl" />
      </div>
    </div>

    {/* Échéance */}
    <div className="mx-5 lg:mx-8 mt-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </div>
    </div>
  </div>
);
