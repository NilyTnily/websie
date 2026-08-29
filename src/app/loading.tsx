import { Skeleton } from "~/ui/primitives/skeleton";

export default function RootLoading() {
  return (
    <div className={`
      mx-auto max-w-7xl px-6 py-10
      sm:px-14
    `}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className={`
        mt-8 grid grid-cols-1 gap-6
        sm:grid-cols-2
        lg:grid-cols-3
      `}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="space-y-3" key={i}>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
