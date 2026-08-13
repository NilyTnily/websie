"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/ui/primitives/alert-dialog";

interface ConfirmSubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  confirmMessage: string;
}

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
}: ConfirmSubmitButtonProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className={className} ref={triggerRef} type="button">
          {children}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => triggerRef.current?.form?.requestSubmit()}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
