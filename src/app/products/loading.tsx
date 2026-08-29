import { Skeleton } from "~/ui/primitives/skeleton";

export default function ProductsLoading() {
  return (
    <div className={`
      mx-auto max-w-[1920px] px-4 py-8
      sm:px-6
      lg:px-8
    `}>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex gap-8">
        <div className={`
          hidden w-[280px] shrink-0 space-y-4
          lg:block
        `}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-32 w-full" key={i} />
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="mb-6 h-10 w-full" />
          <div className={`
            grid grid-cols-1 gap-6
            sm:grid-cols-2
            xl:grid-cols-3
            2xl:grid-cols-4
          `}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="space-y-3" key={i}>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
