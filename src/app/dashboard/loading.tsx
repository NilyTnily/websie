import { Skeleton } from "~/ui/primitives/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className={`
        grid grid-cols-1 gap-4
        sm:grid-cols-3
      `}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton className="h-28 w-full" key={i} />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
