import { Skeleton } from "~/ui/primitives/skeleton";

export default function WatchesLoading() {
  return (
    <div className={`
      mx-auto max-w-[1920px] px-4 py-8
      sm:px-6
      lg:px-8
    `}>
      <Skeleton className="mb-6 h-[300px] w-full" />
      <div className="mt-8 flex gap-8">
        <div className={`
          hidden w-[280px] shrink-0 space-y-4
          lg:block
        `}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-28 w-full" key={i} />
          ))}
        </div>
        <div className={`
          grid flex-1 grid-cols-1 gap-6
          sm:grid-cols-2
          xl:grid-cols-3
        `}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="space-y-3" key={i}>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
