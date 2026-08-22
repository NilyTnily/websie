"use client";

import { Search, KeyRound, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";

import type { AdminUserRow } from "~/lib/queries/admin-users";
import { resetUserPasswordAction, deleteUserAction } from "./actions";

const CURRENCY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function useDebouncedSearch(initial: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initial);
  const onChange = (v: string) => {
    setValue(v);
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("q", v);
    else params.delete("q");
    router.replace(`/admin/users?${params.toString()}`);
  };
  return { value, onChange };
}

export function UsersPageClient({ initialData, initialQuery }: { initialData: AdminUserRow[]; initialQuery: string }) {
  const { value: query, onChange: setQuery } = useDebouncedSearch(initialQuery);
  const [resetUser, setResetUser] = useState<AdminUserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    if (!resetUser) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    startTransition(async () => {
      const res = await resetUserPasswordAction(resetUser.id, newPassword);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Password for ${resetUser.email} updated. New password: ${newPassword}`, { duration: 8000 });
      // copy to clipboard for convenience
      try { await navigator.clipboard.writeText(newPassword); } catch {}
      setResetUser(null);
      setNewPassword("");
    });
  };

  const handleDelete = (user: AdminUserRow) => {
    if (!confirm(`Delete ${user.email}? This removes the user and their sessions/inquiries links (inquiries kept as guest).`)) return;
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (!res.success) toast.error(res.error);
      else { toast.success("User deleted"); window.location.reload(); }
    });
  };

  const generateRandom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let s = "";
    for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(s);
  };

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name || "—"}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: "inquiryCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Inquiries" />,
      cell: ({ row }) => <span className="text-center">{row.original.inquiryCount}</span>,
    },
    {
      accessorKey: "totalRequested",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
      cell: ({ row }) => <span className="text-sm">{CURRENCY.format(row.original.totalRequested)}</span>,
    },
    {
      accessorKey: "pendingAmount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pending (gonna spend)" />,
      cell: ({ row }) => <span className="text-sm text-amber-600">{CURRENCY.format(row.original.pendingAmount)}</span>,
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Delivered (spent)" />,
      cell: ({ row }) => <span className="text-sm font-medium text-primary">{CURRENCY.format(row.original.totalSpent)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => { setResetUser(row.original); setNewPassword(""); }}>
            <KeyRound className="h-3.5 w-3.5" /> Reset pass
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{initialData.length} users</span>
      </div>

      <div className="rounded-md border">
        <DataTable columns={columns} data={initialData} />
      </div>
      <p className="text-xs text-muted-foreground">
        Note: “Cart” is client localStorage — not visible server-side. Use inquiries: <code>pending</code> = gonna spend, <code>delivered</code> = spent. Passwords are hashed with <code>better-auth/crypto:hashPassword</code> (scrypt) — plaintext cannot be recovered, only reset. New password is shown once and sessions are revoked.
      </p>

      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password for {resetUser?.email}</DialogTitle>
            <DialogDescription>
              Set a new password. It will be hashed, old password cannot be viewed. User will be logged out everywhere and must use the new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="newPass">New password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="newPass"
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generateRandom}>Generate</Button>
              </div>
            </div>
            {newPassword && (
              <div className="flex items-center gap-2 rounded bg-muted p-2 text-sm">
                <span className="flex-1 font-mono">{newPassword}</span>
                <Button size="sm" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(newPassword); toast.success("Copied"); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
            <Button onClick={handleReset} disabled={isPending || newPassword.length < 8}>
              {isPending ? "Saving..." : "Set new password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
