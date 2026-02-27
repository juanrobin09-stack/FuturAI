"use client";

/**
 * Skeleton loading components — premium shimmer effect
 * Replace boring spinners with layout-preserving placeholders.
 */

export function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-3/4" />
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
        <SkeletonPulse className="h-8 w-8 rounded-lg shrink-0 ml-3" />
      </div>
      <SkeletonPulse className="h-3 w-full mb-2" />
      <SkeletonPulse className="h-3 w-5/6 mb-4" />
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-5 w-20 rounded-full" />
        <div className="flex gap-2">
          <SkeletonPulse className="h-4 w-8" />
          <SkeletonPulse className="h-4 w-8" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4">
        <SkeletonPulse className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-2/3" />
          <SkeletonPulse className="h-3 w-full" />
          <SkeletonPulse className="h-3 w-4/5" />
          <div className="flex gap-3 pt-1">
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, type = "card" }: { count?: number; type?: "card" | "list" }) {
  const Component = type === "list" ? SkeletonListItem : SkeletonCard;
  return (
    <div className={type === "list" ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
