"use client";

import { useActionState } from "react";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import type { CategoryFormState } from "./actions";

interface CategoryFormProps {
  action: (
    state: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  defaultValues?: { description: string; image: string; name: string };
  submitLabel: string;
}

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
}: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState<
    CategoryFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          defaultValue={defaultValues?.name}
          id="name"
          name="name"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          className={`
            flex min-h-20 w-full rounded-md border border-input bg-transparent
            px-3 py-2 text-sm shadow-xs outline-none
            focus-visible:border-ring focus-visible:ring-[3px]
            focus-visible:ring-ring/50
          `}
          defaultValue={defaultValues?.description}
          id="description"
          name="description"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="image">Image URL</Label>
        <Input
          defaultValue={defaultValues?.image}
          id="image"
          name="image"
          required
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
