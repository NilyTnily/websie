interface StatCardProps {
  label: string;
  value: number | string;
}

export function StatCardGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div
      className={`
        grid grid-cols-2 gap-4
        sm:grid-cols-3
        lg:grid-cols-5
      `}
    >
      {stats.map((stat) => (
        <div className="rounded-md border p-4" key={stat.label}>
          <p className="text-xs text-muted-foreground uppercase">
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
