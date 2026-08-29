import { Skeleton } from "~/ui/primitives/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className={`
        grid grid-cols-1 gap-4
        sm:grid-cols-4
      `}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton className="h-24 w-full" key={i} />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
