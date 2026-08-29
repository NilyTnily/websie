"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import type { IntegrationSettings, SiteSettings } from "~/db/schema";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Switch } from "~/ui/primitives/switch";

import type { SettingsFormState } from "./actions";

import {
  updateIntegrationSettingsAction,
  updateSiteSettingsAction,
} from "./actions";

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

interface SettingsPageClientProps {
  integrationSettings: IntegrationSettings | null;
  settings: SiteSettings;
}

export function SettingsPageClient({
  integrationSettings,
  settings,
}: SettingsPageClientProps) {
  const [state, formAction, isPending] = useActionState<
    SettingsFormState,
    FormData
  >(updateSiteSettingsAction, {});

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl ?? "");
  const [noMoneyMode, setNoMoneyMode] = useState(settings.noMoneyMode);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Branding, contact details, and storefront behavior shown across the
          whole site.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Hidden mirror for the Switch — Radix Switch doesn't submit as a form field. */}
        <input
          name="noMoneyMode"
          type="hidden"
          value={noMoneyMode ? "on" : ""}
        />

        <Card>
          <CardHeader>
            <CardTitle>Identity &amp; Branding</CardTitle>
            <CardDescription>
              The name and story search engines and visitors see first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`
                grid grid-cols-1 gap-4
                sm:grid-cols-2
              `}
            >
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
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
              <p className="text-xs text-muted-foreground">
                Used for search engines and page metadata.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-2
              `}
            >
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social &amp; Contact</CardTitle>
            <CardDescription>
              Where customers reach you outside the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`
                grid grid-cols-1 gap-4
                sm:grid-cols-2
              `}
            >
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
            <div className="space-y-1.5">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                defaultValue={settings.whatsappNumber ?? ""}
                id="whatsappNumber"
                name="whatsappNumber"
                placeholder="+1 555 000 0000"
              />
              <p className="text-xs text-muted-foreground">
                Shown in the footer so visitors can reach you on WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storefront Behavior</CardTitle>
            <CardDescription>
              Switches that change how the public site works.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <span className="space-y-1">
                <span className="block text-sm font-medium">No Money Mode</span>
                <span className="block text-sm text-muted-foreground">
                  Hides every price on the public site — product cards, product
                  pages, and the bag show &quot;Contact Us&quot; instead, and
                  checkout becomes the inquiry form. Prices still show here in
                  admin for your own reference.
                </span>
              </span>
              <Switch
                aria-label="No Money Mode"
                checked={noMoneyMode}
                onCheckedChange={setNoMoneyMode}
              />
            </div>
          </CardContent>
        </Card>

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

      <IntegrationSettingsForm integrationSettings={integrationSettings} />
    </div>
  );
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

function IntegrationSettingsForm({
  integrationSettings,
}: {
  integrationSettings: IntegrationSettings | null;
}) {
  const [state, formAction, isPending] = useActionState<
    SettingsFormState,
    FormData
  >(updateIntegrationSettingsAction, {});

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Integration</CardTitle>
          <CardDescription>
            Connects your WhatsApp Business number to the site so tracking
            replies auto-match to orders. Leave any field blank to fall back
            to the matching environment variable instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
            <Input
              defaultValue={integrationSettings?.whatsappPhoneNumberId ?? ""}
              id="whatsappPhoneNumberId"
              name="whatsappPhoneNumberId"
              placeholder="From WhatsApp → API Setup"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsappAccessToken">Access Token</Label>
            <Input
              autoComplete="off"
              defaultValue={integrationSettings?.whatsappAccessToken ?? ""}
              id="whatsappAccessToken"
              name="whatsappAccessToken"
              placeholder="From WhatsApp → API Setup, or a System User token"
              type="password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsappAppSecret">App Secret</Label>
            <Input
              autoComplete="off"
              defaultValue={integrationSettings?.whatsappAppSecret ?? ""}
              id="whatsappAppSecret"
              name="whatsappAppSecret"
              placeholder="From App Settings → Basic"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Used to verify that incoming webhook messages really come from
              Meta.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsappVerifyToken">Webhook Verify Token</Label>
            <Input
              defaultValue={integrationSettings?.whatsappVerifyToken ?? ""}
              id="whatsappVerifyToken"
              name="whatsappVerifyToken"
              placeholder="Any string you choose"
            />
            <p className="text-xs text-muted-foreground">
              Make this up yourself, then enter the same value when
              registering the webhook URL in Meta&apos;s dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-600">WhatsApp settings saved.</p>
      )}

      <Button disabled={isPending} type="submit" variant="outline">
        {isPending ? "Saving…" : "Save WhatsApp Settings"}
      </Button>
    </form>
  );
}
