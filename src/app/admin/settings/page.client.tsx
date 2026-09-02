"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import type { IntegrationSettings, SiteSettings } from "~/db/schema";

import { UploadButton } from "~/lib/uploadthing";
import { DEFAULT_TEMPLATE_BODIES } from "~/lib/whatsapp-template-vars";
import { ImageOff, Search } from "lucide-react";

import { Button } from "~/ui/primitives/button";
import { Checkbox } from "~/ui/primitives/checkbox";
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
import { TemplateBodyDialog } from "./template-body-dialog";
import {
  GOOGLE_TUTORIAL_STEPS,
  TutorialDialog,
  WHATSAPP_TUTORIAL_STEPS,
} from "./tutorial-dialog";

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

import type { CategoryWithCount, ProductWithRelations } from "~/db/schema";

interface SettingsPageClientProps {
  allProducts: ProductWithRelations[];
  categories: CategoryWithCount[];
  integrationSettings: IntegrationSettings | null;
  settings: SiteSettings;
}

export function SettingsPageClient({
  allProducts,
  categories,
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
  const [homeSpotlightImageUrl, setHomeSpotlightImageUrl] = useState(
    settings.homeSpotlightImageUrl ?? "",
  );
  const [homeLoupeImageUrl, setHomeLoupeImageUrl] = useState(settings.homeLoupeImageUrl ?? "");
  const [homeWatchesHeroImageUrl, setHomeWatchesHeroImageUrl] = useState(
    settings.homeWatchesHeroImageUrl ?? "",
  );
  const [homeJewelryHeroImageUrl, setHomeJewelryHeroImageUrl] = useState(
    settings.homeJewelryHeroImageUrl ?? "",
  );
  const [newPiecesIds, setNewPiecesIds] = useState<string[]>(settings.homeNewPiecesIds ?? []);
  const [shopTheLookIds, setShopTheLookIds] = useState<string[]>(settings.homeShopTheLookIds ?? []);

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

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>Brand Assets</CardTitle>
            <CardDescription>Logo and favicon shown across the site and browser tab.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`
                grid grid-cols-1 gap-4
                sm:grid-cols-2 sm:gap-6
              `}
            >
              <div
                className={`
                  rounded-xl border bg-muted/20 p-4
                  sm:border-0 sm:bg-transparent sm:p-0
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
              </div>
              <div
                className={`
                  rounded-xl border bg-muted/20 p-4
                  sm:border-0 sm:bg-transparent sm:p-0
                `}
              >
                <ImageField
                  currentUrl={faviconUrl || null}
                  helperText="Shown in the browser tab. Square image works best."
                  label="Favicon"
                  name="faviconUrl"
                  onChange={setFaviconUrl}
                  previewShape="circle"
                />
              </div>
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
            <CardTitle>Homepage — Photos</CardTitle>
            <CardDescription>
              All homepage photos with names. Hover a thumbnail to Add / Change / Delete. Leave blank to keep default.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <ImageField
                currentUrl={homeSpotlightImageUrl || null}
                fallbackUrl="/hero-flythrough/scene4-desktop.webp"
                helperText="Spotlight Banner — full-bleed between New Pieces and Shop by type"
                label="Spotlight Banner"
                name="homeSpotlightImageUrl"
                onChange={setHomeSpotlightImageUrl}
                previewShape="square"
              />
              <ImageField
                currentUrl={homeLoupeImageUrl || null}
                fallbackUrl="/hero-flythrough/scene3-desktop.webp"
                helperText="Loupe Band — Under the loupe (scene3) 1200×900"
                label="Loupe Band"
                name="homeLoupeImageUrl"
                onChange={setHomeLoupeImageUrl}
                previewShape="square"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <ImageField
                currentUrl={homeWatchesHeroImageUrl || null}
                fallbackUrl="https://images.unsplash.com/photo-1628608570910-5ba45093d2c2?q=80&w=2000&auto=format&fit=crop"
                helperText="Watches hero — background for /watches"
                label="Watches — Hero"
                name="homeWatchesHeroImageUrl"
                onChange={setHomeWatchesHeroImageUrl}
                previewShape="square"
              />
              <ImageField
                currentUrl={homeJewelryHeroImageUrl || null}
                fallbackUrl="https://images.unsplash.com/photo-1514612497953-05d1e5e171fa?q=80&w=2000&auto=format&fit=crop"
                helperText="Jewelry hero — background for /jewelry"
                label="Jewelry — Hero"
                name="homeJewelryHeroImageUrl"
                onChange={setHomeJewelryHeroImageUrl}
                previewShape="square"
              />
            </div>
            {/* Shop by type tiles — also homepage photos (the 2 big buttons from Image 1) — kept as single source, no duplication */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium">Shop by type — Homepage Tiles (2 photos)</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                The two big “Watches / Jewelry” buttons on homepage — same images as Categories. Shown here as homepage photos per request.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-6">
                {categories.map((cat) => (
                  <div
                    key={`home-${cat.id}`}
                    className={`
                      rounded-xl border bg-muted/20 p-3
                      sm:border-0 sm:bg-transparent sm:p-0
                    `}
                  >
                    <CategoryImageField category={cat} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Featured <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">PREMIUM</span>
            </CardTitle>
            <CardDescription>Choose products for homepage jewelry sections. Drag to reorder. New Pieces up to 10, Shop The Look exactly 2.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* hidden inputs for form submit */}
            <input type="hidden" name="homeNewPiecesIds" value={JSON.stringify(newPiecesIds)} />
            <input type="hidden" name="homeShopTheLookIds" value={JSON.stringify(shopTheLookIds)} />
            <FeaturedPicker
              allProducts={allProducts}
              label="New Pieces — carousel (jewelry)"
              max={10}
              selectedIds={newPiecesIds}
              onChange={setNewPiecesIds}
            />
            <FeaturedPicker
              allProducts={allProducts}
              label="Shop The Look — pair (jewelry)"
              max={2}
              selectedIds={shopTheLookIds}
              onChange={setShopTheLookIds}
            />
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
  fallbackUrl,
  helperText,
  label,
  name,
  onChange,
  previewShape,
}: ImageFieldProps & { fallbackUrl?: string | null }) {
  const displayUrl = currentUrl || fallbackUrl || null;
  const isFallback = !currentUrl && !!fallbackUrl;
  const hasImage = !!displayUrl;
  const hasRealImage = !!currentUrl;
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium">{label}</Label>
      {/* Thumbnail — never a button itself. Empty shows "No photo" placeholder, actions are hover (desktop) or below (mobile). */}
      <div className="flex flex-col items-center gap-3 sm:items-start">
        <div
          className={`
            group relative flex h-24 w-24 items-center justify-center overflow-hidden border bg-muted shadow-sm
            ${previewShape === "circle" ? "rounded-full" : "rounded-xl"}
            ${hasImage ? "border-border" : "border-dashed border-border/60 bg-muted/40"}
          `}
        >
          {hasImage ? (
            <>
              <Image alt={label} className="object-cover" fill sizes="96px" src={displayUrl!} />
              {isFallback && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[9px] font-medium tracking-wide text-white">
                  Default
                </span>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-2 text-center">
              <ImageOff className="h-5 w-5 text-muted-foreground/60" />
              <span className="text-[11px] font-medium leading-none text-muted-foreground">
                No photo
              </span>
            </div>
          )}
          {/* Desktop hover overlay — Add / Change / Delete appear on hover, not on thumbnail itself */}
          <div className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/55 backdrop-blur-[1px] sm:group-hover:flex">
            <UploadButton
              appearance={{
                button: "h-7 rounded-full bg-white px-3 text-xs font-medium text-black shadow hover:bg-white/90",
                container: "w-auto",
                allowedContent: "hidden",
              }}
              content={{ button: hasRealImage ? "Change" : "Add" }}
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const uploaded = res[0]?.ufsUrl;
                if (uploaded) onChange(uploaded);
              }}
              onUploadError={(uploadError: Error) => {
                toast.error(`Upload failed: ${uploadError.message}`);
              }}
            />
            {hasRealImage && (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 rounded-full px-3 text-xs shadow"
                type="button"
                onClick={() => onChange("")}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
        {/* Mobile: beautiful pill buttons below thumbnail, not large blue squares */}
        <div className="flex w-full max-w-[200px] gap-2 sm:hidden">
          <UploadButton
            appearance={{
              button:
                "h-9 flex-1 rounded-full border bg-white px-3 text-xs font-medium shadow-sm hover:bg-accent",
              container: "flex-1",
              allowedContent: "hidden",
            }}
            content={{ button: hasRealImage ? "Change" : "Add" }}
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const uploaded = res[0]?.ufsUrl;
              if (uploaded) onChange(uploaded);
            }}
            onUploadError={(uploadError: Error) => {
              toast.error(`Upload failed: ${uploadError.message}`);
            }}
          />
          <Button
            size="sm"
            variant={hasRealImage ? "destructive" : "outline"}
            className="h-9 flex-1 rounded-full text-xs font-medium shadow-sm"
            type="button"
            disabled={!hasRealImage}
            onClick={() => hasRealImage && onChange("")}
          >
            Delete
          </Button>
        </div>
      </div>
      <input type="hidden" name={name} value={currentUrl ?? ""} />
      <p className="text-center text-xs leading-tight text-muted-foreground sm:text-left">
        {helperText}
      </p>
    </div>
  );
}

function VideoField({
  currentUrl,
  fallbackUrl,
  helperText,
  label,
  name,
  onChange,
}: {
  currentUrl: string | null;
  fallbackUrl?: string | null;
  helperText: string;
  label: string;
  name: string;
  onChange: (url: string) => void;
}) {
  const displayUrl = currentUrl || fallbackUrl || null;
  const isFallback = !currentUrl && !!fallbackUrl;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="group relative h-24 w-24 overflow-hidden rounded-md border border-border bg-black">
        {displayUrl ? (
          <video src={displayUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">No video</span>
          </div>
        )}
        {isFallback && (
          <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[9px] font-medium tracking-wide text-white">
            Default
          </span>
        )}
        <UploadButton
          appearance={{
            button: "absolute inset-0 h-full w-full rounded-md bg-black/0 opacity-0 hover:bg-black/10",
            container: "absolute inset-0",
            allowedContent: "hidden",
          }}
          content={{ button: "" }}
          endpoint="videoUploader"
          onClientUploadComplete={(res) => {
            const uploaded = res[0]?.ufsUrl;
            if (uploaded) onChange(uploaded);
          }}
          onUploadError={(uploadError: Error) => {
            toast.error(`Upload failed: ${uploadError.message}`);
          }}
        />
        {currentUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 sm:group-hover:flex"
            aria-label="Delete"
          >
            ×
          </button>
        )}
        {currentUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white sm:hidden"
            aria-label="Delete"
          >
            ×
          </button>
        )}
      </div>
      {currentUrl && (
        <div className="flex gap-1 sm:hidden">
          <UploadButton
            appearance={{
              button: "h-8 flex-1 rounded-md bg-white border text-xs shadow-sm",
              container: "flex-1",
              allowedContent: "hidden",
            }}
            content={{ button: "Change" }}
            endpoint="videoUploader"
            onClientUploadComplete={(res) => {
              const uploaded = res[0]?.ufsUrl;
              if (uploaded) onChange(uploaded);
            }}
            onUploadError={(uploadError: Error) => {
              toast.error(`Upload failed: ${uploadError.message}`);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 rounded-md border text-xs bg-white shadow-sm"
            type="button"
            onClick={() => onChange("")}
          >
            Delete
          </Button>
        </div>
      )}
      {!currentUrl && (
        <div className="sm:hidden">
          <UploadButton
            appearance={{
              button: "h-8 w-full rounded-md bg-white border text-xs shadow-sm",
              container: "w-full",
              allowedContent: "hidden",
            }}
            content={{ button: "Add video" }}
            endpoint="videoUploader"
            onClientUploadComplete={(res) => {
              const uploaded = res[0]?.ufsUrl;
              if (uploaded) onChange(uploaded);
            }}
            onUploadError={(uploadError: Error) => {
              toast.error(`Upload failed: ${uploadError.message}`);
            }}
          />
        </div>
      )}
      <input type="hidden" name={name} value={currentUrl ?? ""} />
      <p className="text-xs leading-tight text-muted-foreground">{helperText}</p>
    </div>
  );
}

function CategoryImageField({ category }: { category: { id: string; image: string; name: string } }) {
  const [url, setUrl] = useState(category.image);
  const [isSaving, startSaving] = useTransition();
  const handleSave = (nextUrl: string) => {
    setUrl(nextUrl);
    startSaving(async () => {
      const { updateCategoryImage } = await import("./actions");
      const res = await updateCategoryImage(category.id, nextUrl);
      if (!res.success) {
        toast.error(res.error ?? "Failed to update image");
        return;
      }
      toast.success(`${category.name} image updated`);
    });
  };
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium">{category.name}</Label>
      <div className="flex flex-col items-center gap-3 sm:items-start">
        <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
          <Image alt={category.name} className="object-cover" fill sizes="96px" src={url} />
          {/* Desktop hover — Change */}
          <div className="absolute inset-0 hidden items-center justify-center gap-1 bg-black/55 backdrop-blur-[1px] sm:group-hover:flex">
            <UploadButton
              appearance={{
                button: "h-7 rounded-full bg-white px-3 text-xs font-medium text-black shadow hover:bg-white/90",
                container: "w-auto",
                allowedContent: "hidden",
              }}
              content={{ button: "Change" }}
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const uploaded = res[0]?.ufsUrl;
                if (uploaded) handleSave(uploaded);
              }}
              onUploadError={(e) => {
                toast.error(e.message);
              }}
            />
          </div>
          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="text-[11px] font-medium text-foreground">Saving…</span>
            </div>
          )}
        </div>
        {/* Mobile: pill Change button below thumbnail — beautiful, not overlay */}
        <div className="flex w-full justify-center sm:hidden">
          <UploadButton
            appearance={{
              button: "h-8 rounded-full border bg-white px-4 text-xs font-medium shadow-sm hover:bg-accent",
              container: "w-auto",
              allowedContent: "hidden",
            }}
            content={{ button: "Change" }}
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const uploaded = res[0]?.ufsUrl;
              if (uploaded) handleSave(uploaded);
            }}
            onUploadError={(e) => {
              toast.error(e.message);
            }}
          />
        </div>
      </div>
      <p className="text-center text-xs leading-tight text-muted-foreground sm:text-left">
        Background for Shop by type — {category.name}
      </p>
    </div>
  );
}

function FeaturedPicker({
  allProducts,
  label,
  max,
  onChange,
  selectedIds,
}: {
  allProducts: ProductWithRelations[];
  label: string;
  max: number;
  onChange: (ids: string[]) => void;
  selectedIds: string[];
}) {
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = allProducts.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.name} ${p.ref} ${p.category.name} ${p.subcategory?.name ?? ""}`.toLowerCase().includes(q);
  });

  const selectedProducts = selectedIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as ProductWithRelations[];

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= max) {
        toast.error(`Only ${max} products allowed for ${label}`);
        return;
      }
      onChange([...selectedIds, id]);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = selectedIds.filter((id) => id !== draggedId);
    const idx = next.indexOf(targetId);
    next.splice(idx, 0, draggedId);
    onChange(next);
    setDraggedId(null);
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground">
          {selectedIds.length}/{max} selected
        </span>
      </div>
      {selectedProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {selectedProducts.map((p) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setDraggedId(p.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(p.id)}
              className={`group relative flex cursor-grab flex-col items-center gap-1 rounded border bg-card p-2 active:cursor-grabbing ${draggedId === p.id ? "opacity-40" : ""}`}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded bg-muted">
                <Image alt={p.name} fill className="object-cover" sizes="64px" src={p.image} />
              </div>
              <p className="line-clamp-1 text-center text-xs">{p.name}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1 text-xs"
                type="button"
                onClick={() => toggle(p.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder="Search products to add…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-64 space-y-1 overflow-auto rounded border">
        {filtered.slice(0, 50).map((p) => {
          const checked = selectedIds.includes(p.id);
          const atCap = !checked && selectedIds.length >= max;
          return (
            <label
              key={p.id}
              className={`flex items-center gap-2 px-2 py-1 text-sm hover:bg-muted ${atCap ? "opacity-40" : ""}`}
            >
              <Checkbox
                checked={checked}
                disabled={atCap}
                onCheckedChange={() => toggle(p.id)}
              />
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                <Image alt={p.name} fill className="object-cover" sizes="32px" src={p.image} />
              </div>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.category.name}</span>
            </label>
          );
        })}
        {filtered.length === 0 && <p className="p-2 text-sm text-muted-foreground">No products found.</p>}
      </div>
      <p className="text-xs text-muted-foreground">Drag selected thumbnails to reorder. {label.includes("New Pieces") ? "Up to 10 shown in carousel." : "Exactly 2 shown side-by-side."}</p>
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

  const [verifyToken, setVerifyToken] = useState(
    integrationSettings?.whatsappVerifyToken ?? "",
  );

  const generateVerifyToken = () => {
    // 32-char URL-safe alphanumeric — uses Web Crypto if available, falls back to randomUUID
    let token = "";
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      // base36-ish but deterministic length: hex → 48 chars, slice to 32
      token = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
    } else {
      token = (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as unknown as { randomUUID: () => string }).randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      ).slice(0, 32);
    }
    setVerifyToken(token);
    toast.success("Verify token generated — remember to save and paste same value in Meta.");
  };

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Google Sign-In</CardTitle>
            <CardDescription>
              Lets customers sign in with Google on the sign-in page. Leave
              blank to fall back to the matching environment variable
              instead.
            </CardDescription>
          </div>
          <TutorialDialog
            buttonLabel="Tutorial"
            dialogDescription="Follow these steps in the Google Cloud Console to get a Client ID and Client Secret."
            dialogTitle="Setting up Google Sign-In"
            steps={GOOGLE_TUTORIAL_STEPS}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="googleClientId">Client ID</Label>
            <Input
              defaultValue={integrationSettings?.googleClientId ?? ""}
              id="googleClientId"
              name="googleClientId"
              placeholder="From Google Cloud Console → Credentials"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="googleClientSecret">Client Secret</Label>
            <Input
              autoComplete="off"
              defaultValue={integrationSettings?.googleClientSecret ?? ""}
              id="googleClientSecret"
              name="googleClientSecret"
              placeholder="From Google Cloud Console → Credentials"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Authorized redirect URI:{" "}
              <code className="text-foreground">
                {"{your domain}"}/api/auth/callback/google
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>WhatsApp Integration</CardTitle>
            <CardDescription>
              Connects your WhatsApp Business number to the site so tracking
              replies auto-match to orders. Leave any field blank to fall
              back to the matching environment variable instead.
            </CardDescription>
          </div>
          <TutorialDialog
            buttonLabel="Tutorial"
            dialogDescription="Every parameter below, where to find it in Meta Business Manager, and how to enable automatic order messages."
            dialogTitle="Setting up WhatsApp"
            steps={WHATSAPP_TUTORIAL_STEPS}
          />
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
            <div className="flex gap-2">
              <Input
                className="flex-1"
                id="whatsappVerifyToken"
                name="whatsappVerifyToken"
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="Any string you choose"
                value={verifyToken}
              />
              <Button onClick={generateVerifyToken} type="button" variant="outline">
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click Generate to auto-create a secure random token, then save and paste the same value when
              registering the webhook URL in Meta&apos;s dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Message Templates</CardTitle>
          <CardDescription>
            The 5 messages the site sends (4 automatic + 1 manual New Arrivals broadcast). Click{" "}
            <strong>Edit Message</strong> to change the wording — this is
            what you should copy into Meta Business Manager when creating or
            updating the approved template. Each message already defaults to
            a matching template name automatically; only open{" "}
            <strong>Advanced</strong> if you named yours differently in Meta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TemplateRow
            bodyDefaultValue={
              integrationSettings?.whatsappTemplateOrderConfirmedBody ||
              DEFAULT_TEMPLATE_BODIES.orderConfirmed
            }
            bodyName="whatsappTemplateOrderConfirmedBody"
            label="Order Confirmed"
            nameDefaultValue={integrationSettings?.whatsappTemplateOrderConfirmed}
            nameField="whatsappTemplateOrderConfirmed"
            namePlaceholder="order_confirmed"
            sentWhen="right after checkout / new inquiry"
          />
          <TemplateRow
            bodyDefaultValue={
              integrationSettings?.whatsappTemplateOrderStatusUpdateBody ||
              DEFAULT_TEMPLATE_BODIES.orderStatusUpdate
            }
            bodyName="whatsappTemplateOrderStatusUpdateBody"
            label="Order Status Update"
            nameDefaultValue={
              integrationSettings?.whatsappTemplateOrderStatusUpdate
            }
            nameField="whatsappTemplateOrderStatusUpdate"
            namePlaceholder="order_status_update"
            sentWhen="approve/reject, and any generic delivery-status change"
          />
          <TemplateRow
            bodyDefaultValue={
              integrationSettings?.whatsappTemplateOrderShippedBody ||
              DEFAULT_TEMPLATE_BODIES.orderShipped
            }
            bodyName="whatsappTemplateOrderShippedBody"
            label="Order Shipped"
            nameDefaultValue={integrationSettings?.whatsappTemplateOrderShipped}
            nameField="whatsappTemplateOrderShipped"
            namePlaceholder="order_shipped"
            sentWhen={`delivery status becomes "shipped"`}
          />
          <TemplateRow
            bodyDefaultValue={
              integrationSettings?.whatsappTemplateOrderCancelledRefundedBody ||
              DEFAULT_TEMPLATE_BODIES.orderCancelledRefunded
            }
            bodyName="whatsappTemplateOrderCancelledRefundedBody"
            label="Order Cancelled / Refunded"
            nameDefaultValue={
              integrationSettings?.whatsappTemplateOrderCancelledRefunded
            }
            nameField="whatsappTemplateOrderCancelledRefunded"
            namePlaceholder="order_cancelled_refunded"
            sentWhen="delivery status becomes cancelled or refunded"
          />
          <TemplateRow
            bodyDefaultValue={
              (integrationSettings as unknown as Record<string, null | string>)?.whatsappTemplateNewArrivalsBody ||
              DEFAULT_TEMPLATE_BODIES.newArrivals
            }
            bodyName="whatsappTemplateNewArrivalsBody"
            label="New Arrivals Broadcast"
            nameDefaultValue={(integrationSettings as unknown as Record<string, null | string>)?.whatsappTemplateNewArrivals}
            nameField="whatsappTemplateNewArrivals"
            namePlaceholder="new_arrivals"
            sentWhen="manual broadcast from /admin/new-arrivals to all contacts with phone"
          />
        </CardContent>
      </Card>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-600">Integration settings saved.</p>
      )}

      <Button disabled={isPending} type="submit" variant="outline">
        {isPending ? "Saving…" : "Save Integration Settings"}
      </Button>
    </form>
  );
}

function TemplateRow({
  bodyDefaultValue,
  bodyName,
  label,
  nameDefaultValue,
  nameField,
  namePlaceholder,
  sentWhen,
}: {
  bodyDefaultValue: string;
  bodyName: string;
  label: string;
  nameDefaultValue: null | string | undefined;
  nameField: string;
  namePlaceholder: string;
  sentWhen: string;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{label}</p>
        <TemplateBodyDialog
          defaultValue={bodyDefaultValue}
          label={label}
          name={bodyName}
          sentWhen={sentWhen}
        />
      </div>

      {showAdvanced ? (
        <div className="space-y-1.5">
          <Label htmlFor={nameField}>Meta template name</Label>
          <Input
            defaultValue={nameDefaultValue ?? ""}
            id={nameField}
            name={nameField}
            placeholder={namePlaceholder}
          />
          <p className="text-xs text-muted-foreground">
            Defaults to <code className="text-foreground">{namePlaceholder}</code>{" "}
            when left blank — only change this if the template you approved
            in Meta Business Manager uses a different name.
          </p>
        </div>
      ) : (
        <>
          <input name={nameField} readOnly type="hidden" value={nameDefaultValue ?? ""} />
          <button
            className={`
              text-xs text-muted-foreground underline underline-offset-2
            `}
            onClick={() => setShowAdvanced(true)}
            type="button"
          >
            Advanced: change Meta template name
          </button>
        </>
      )}
    </div>
  );
}
