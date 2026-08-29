import { Skeleton } from "~/ui/primitives/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className={`
      container px-4 py-10
      md:px-6
    `}>
      <Skeleton className="mb-6 h-4 w-64" />
      <div className={`
        grid grid-cols-1 gap-10
        md:grid-cols-[1fr_468px]
      `}>
        <Skeleton className="h-[500px] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
