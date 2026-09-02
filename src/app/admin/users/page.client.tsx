"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Copy, Eye, EyeOff, KeyRound, Search, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { AdminUserRow } from "~/lib/queries/admin-users";

import { Button } from "~/ui/primitives/button";
import { DataTable } from "~/ui/primitives/data-table/data-table";
import { DataTableColumnHeader } from "~/ui/primitives/data-table/data-table-column-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import { deleteUserAction, resetUserPasswordAction } from "./actions";

const CURRENCY = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export function UsersPageClient({
  initialData,
  initialQuery,
}: { initialData: AdminUserRow[]; initialQuery: string }) {
  const { onChange: setQuery, value: query } = useDebouncedSearch(initialQuery);
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
      toast.success(
        `Password for ${resetUser.email} updated. New password: ${newPassword}`,
        { duration: 8000 },
      );
      void navigator.clipboard.writeText(newPassword).catch(() => undefined);
      setResetUser(null);
      setNewPassword("");
    });
  };

  const handleDelete = (user: AdminUserRow) => {
    if (
      !confirm(
        `Delete ${user.email}? This removes the user and their sessions/inquiries links (inquiries kept as guest).`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (!res.success) toast.error(res.error);
      else {
        toast.success("User deleted");
        window.location.reload();
      }
    });
  };

  const generateRandom = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let s = "";
    for (let i = 0; i < 12; i++)
      s += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(s);
  };

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name || "—"}</span>
      ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "email",
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "phone",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone || "—"}</span>
      ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
    },
    {
      accessorKey: "inquiryCount",
      cell: ({ row }) => (
        <span className="text-center">{row.original.inquiryCount}</span>
      ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inquiries" />
      ),
    },
    {
      accessorKey: "totalRequested",
      cell: ({ row }) => (
        <span className="text-sm">
          {CURRENCY.format(row.original.totalRequested)}
        </span>
      ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requested" />
      ),
    },
    {
      accessorKey: "pendingAmount",
      cell: ({ row }) => (
        <span className="text-sm text-amber-600">
          {CURRENCY.format(row.original.pendingAmount)}
        </span>
      ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pending value" />
      ),
    },
    {
      accessorKey: "totalSpent",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-primary">
          {CURRENCY.format(row.original.totalSpent)}
        </span>
      ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivered value" />
      ),
    },
    {
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          <Button
            onClick={() => {
              setResetUser(row.original);
              setNewPassword("");
            }}
            size="sm"
            variant="outline"
          >
            <KeyRound className="h-3.5 w-3.5" /> Reset pass
          </Button>
          <Button
            onClick={() => handleDelete(row.original)}
            size="sm"
            variant="ghost"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      header: "Actions",
      id: "actions",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            className={`
              absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2
              text-muted-foreground
            `}
          />
          <Input
            className="pl-9"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            value={query}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {initialData.length} users
        </span>
      </div>

      <div className="rounded-md border">
        <DataTable columns={columns} data={initialData} />
      </div>

      <Dialog onOpenChange={(o) => !o && setResetUser(null)} open={!!resetUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password for {resetUser?.email}</DialogTitle>
            <DialogDescription>
              Set a new password. It will be hashed, old password cannot be
              viewed. User will be logged out everywhere and must use the new
              one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="newPass">New password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="newPass"
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                  />
                  <button
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => setShowPass((v) => !v)}
                    type="button"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className={`h-4 w-4`} />
                    )}
                  </button>
                </div>
                <Button
                  onClick={generateRandom}
                  type="button"
                  variant="outline"
                >
                  Generate
                </Button>
              </div>
            </div>
            {newPassword && (
              <div
                className={`
                  flex items-center gap-2 rounded bg-muted p-2 text-sm
                `}
              >
                <span className="flex-1 font-mono">{newPassword}</span>
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(newPassword);
                    toast.success("Copied");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setResetUser(null)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isPending || newPassword.length < 8}
              onClick={handleReset}
            >
              {isPending ? "Saving..." : "Set new password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  return { onChange, value };
}
