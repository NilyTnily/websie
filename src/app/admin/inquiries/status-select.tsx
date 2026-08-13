"use client";

import * as React from "react";

import type { Inquiry } from "~/db/schema";

import { cn } from "~/lib/cn";

import { updateInquiryStatusAction } from "./actions";

const STATUS_OPTIONS: Inquiry["status"][] = ["pending", "approved", "rejected"];

const STATUS_LABEL: Record<Inquiry["status"], string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const STATUS_BADGE_CLASS: Record<Inquiry["status"], string> = {
  approved: `
    border-green-200 bg-green-100 text-green-800
    dark:border-green-900 dark:bg-green-950/40 dark:text-green-400
  `,
  pending: `
    border-amber-200 bg-amber-100 text-amber-800
    dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400
  `,
  rejected: `
    border-red-200 bg-red-100 text-red-800
    dark:border-red-900 dark:bg-red-950/40 dark:text-red-400
  `,
};

interface StatusSelectProps {
  id: string;
  status: Inquiry["status"];
}

export function StatusSelect({ id, status }: StatusSelectProps) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <select
      className={cn(
        `
          h-7 cursor-pointer rounded-full border px-2.5 text-xs font-medium
          shadow-xs outline-none
          focus-visible:ring-[3px] focus-visible:ring-ring/50
          disabled:cursor-not-allowed disabled:opacity-50
        `,
        STATUS_BADGE_CLASS[status],
      )}
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Inquiry["status"];
        startTransition(() => updateInquiryStatusAction(id, next));
      }}
    >
      {STATUS_OPTIONS.map((option) => (
        <option
          className="bg-popover text-popover-foreground"
          key={option}
          value={option}
        >
          {STATUS_LABEL[option]}
        </option>
      ))}
    </select>
  );
}
