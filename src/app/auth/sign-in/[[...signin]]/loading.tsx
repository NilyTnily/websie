import { Skeleton } from "~/ui/primitives/skeleton";

export default function Loading() {
  return (
    <div
      className={`
        grid h-screen w-screen
        md:grid-cols-2
      `}
    >
      <div
        className={`
          bg-krs-onyx hidden
          md:block
        `}
      />
      <div
        className={`
          flex items-center justify-center p-4
          md:p-8
        `}
      >
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
