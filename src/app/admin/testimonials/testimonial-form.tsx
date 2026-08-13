"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import type { TestimonialFormState } from "./actions";

interface TestimonialFormDefaultValues {
  avatarUrl: null | string;
  customerHandle: string;
  customerName: string;
  quote: string;
  sortOrder: number;
}

interface TestimonialFormProps {
  action: (
    state: TestimonialFormState,
    formData: FormData,
  ) => Promise<TestimonialFormState>;
  defaultValues?: TestimonialFormDefaultValues;
  submitLabel: string;
}

export function TestimonialForm({
  action,
  defaultValues,
  submitLabel,
}: TestimonialFormProps) {
  const [state, formAction, isPending] = useActionState<
    TestimonialFormState,
    FormData
  >(action, {});
  const [avatarUrl, setAvatarUrl] = useState(defaultValues?.avatarUrl ?? "");

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          defaultValue={defaultValues?.customerName}
          id="customerName"
          name="customerName"
          placeholder="S. Whitfield"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customerHandle">Handle / Location</Label>
        <Input
          defaultValue={defaultValues?.customerHandle}
          id="customerHandle"
          name="customerHandle"
          placeholder="Private client, London"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="quote">Quote</Label>
        <textarea
          className={`
            flex min-h-24 w-full rounded-md border border-input bg-transparent
            px-3 py-2 text-sm shadow-xs outline-none
            focus-visible:border-ring focus-visible:ring-[3px]
            focus-visible:ring-ring/50
          `}
          defaultValue={defaultValues?.quote}
          id="quote"
          name="quote"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar (optional)</Label>
        <div className="flex items-center gap-3">
          {avatarUrl && (
            <div
              className={`
                relative h-12 w-12 shrink-0 overflow-hidden rounded-full
                border bg-muted
              `}
            >
              <Image
                alt="Avatar preview"
                className="object-cover"
                fill
                sizes="48px"
                src={avatarUrl}
              />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <Input
              id="avatarUrl"
              name="avatarUrl"
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https:// or upload a file"
              value={avatarUrl}
            />
            <UploadButton
              appearance={{
                button: "h-8 px-3 text-xs",
                container: "items-start",
              }}
              content={{ button: "Browse for photo" }}
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const uploaded = res[0]?.ufsUrl;
                if (uploaded) setAvatarUrl(uploaded);
              }}
              onUploadError={(uploadError: Error) => {
                toast.error(`Upload failed: ${uploadError.message}`);
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          defaultValue={defaultValues?.sortOrder ?? 0}
          id="sortOrder"
          min={0}
          name="sortOrder"
          type="number"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
