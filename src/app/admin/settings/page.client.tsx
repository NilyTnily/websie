"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import type { SiteSettings } from "~/db/schema";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import type { SettingsFormState } from "./actions";

import { updateSiteSettingsAction } from "./actions";

const textareaClassName = `
  flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm
  shadow-xs outline-none
  focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
`;

interface ImageFieldProps {
  currentUrl: null | string;
  helperText: string;
  label: string;
  name: string;
  onChange: (url: string) => void;
  previewShape: "circle" | "square";
}

function ImageField({
  currentUrl,
  helperText,
  label,
  name,
  onChange,
  previewShape,
}: ImageFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-3">
        {currentUrl && (
          <div
            className={`
              relative h-14 w-14 shrink-0 overflow-hidden border bg-muted
              ${previewShape === "circle" ? "rounded-full" : "rounded-md"}
            `}
          >
            <Image
              alt={label}
              className="object-contain"
              fill
              sizes="56px"
              src={currentUrl}
            />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            id={name}
            name={name}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https:// or upload a file"
            value={currentUrl ?? ""}
          />
          <UploadButton
            appearance={{
              button: "h-8 px-3 text-xs",
              container: "items-start",
            }}
            content={{ button: "Browse for file" }}
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const uploaded = res[0]?.ufsUrl;
              if (uploaded) onChange(uploaded);
            }}
            onUploadError={(uploadError: Error) => {
              toast.error(`Upload failed: ${uploadError.message}`);
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}

interface SettingsPageClientProps {
  settings: SiteSettings;
}

export function SettingsPageClient({ settings }: SettingsPageClientProps) {
  const [state, formAction, isPending] = useActionState<
    SettingsFormState,
    FormData
  >(updateSiteSettingsAction, {});

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl ?? "");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Site Settings</h2>
        <p className="text-sm text-muted-foreground">
          Controls the name, branding, and identity shown across the whole site.
        </p>
      </div>

      <form action={formAction} className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Site Name</Label>
            <Input
              defaultValue={settings.name}
              id="name"
              name="name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              defaultValue={settings.slogan}
              id="slogan"
              name="slogan"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description (used for search engines and page metadata)
            </Label>
            <textarea
              className={`
                ${textareaClassName}
                min-h-24
              `}
              defaultValue={settings.description}
              id="description"
              name="description"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
          <ImageField
            currentUrl={logoUrl || null}
            helperText="Shown in the header next to the site name."
            label="Logo"
            name="logoUrl"
            onChange={setLogoUrl}
            previewShape="square"
          />
          <ImageField
            currentUrl={faviconUrl || null}
            helperText="Shown in the browser tab. Square image works best."
            label="Favicon"
            name="faviconUrl"
            onChange={setFaviconUrl}
            previewShape="circle"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              defaultValue={settings.instagramUrl ?? ""}
              id="instagramUrl"
              name="instagramUrl"
              placeholder="https://instagram.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              defaultValue={settings.facebookUrl ?? ""}
              id="facebookUrl"
              name="facebookUrl"
              placeholder="https://facebook.com/…"
            />
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600">Settings saved.</p>
        )}

        <Button disabled={isPending} type="submit">
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
