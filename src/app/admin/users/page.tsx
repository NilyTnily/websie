import { getAdminUsersWithSpending } from "~/lib/queries/admin-users";

import { UsersPageClient } from "./page.client";

interface UsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const { q } = await searchParams;
  const users = await getAdminUsersWithSpending(q?.trim() || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by name or email. Passwords are stored hashed (bcrypt/scrypt) and cannot be viewed — you can only set a new one. Cart is client-side (localStorage) so there is no server “in cart” amount; we show <strong>Pending inquiries</strong> as “gonna spend” and <strong>Delivered</strong> as “spent”.
        </p>
      </div>
      <UsersPageClient initialData={users} initialQuery={q ?? ""} />
    </div>
  );
}
