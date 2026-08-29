import { getAdminUsersWithSpending } from "~/lib/queries/admin-users";
import { getUsersWithUploads } from "~/lib/queries/uploads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

import { UsersPageClient } from "./page.client";
import { UploadsTable } from "./uploads-table";

interface UsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const { q } = await searchParams;
  const [users, usersWithUploads] = await Promise.all([
    getAdminUsersWithSpending(q?.trim() || undefined),
    getUsersWithUploads(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by name or email. Passwords can only be reset, never viewed.
        </p>
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">
            Customers ({users.length})
          </TabsTrigger>
          <TabsTrigger value="uploads">
            Uploads ({usersWithUploads.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4" value="customers">
          <UsersPageClient initialData={users} initialQuery={q ?? ""} />
        </TabsContent>
        <TabsContent className="mt-4" value="uploads">
          <UploadsTable users={usersWithUploads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
