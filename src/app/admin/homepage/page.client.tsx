"use client";

import { Image as ImageIcon, Video } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import type { HomepageSettings } from "~/db/schema";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

import type { HomepageSettingsFormState } from "./actions";

import { updateHomepageSettingsAction } from "./actions";

const textareaClassName = `
  flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm
  shadow-xs outline-none
  focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
`;

interface HomepageSettingsPageClientProps {
  settings: HomepageSettings;
}

interface MediaFieldProps {
  accept: "image/*" | "video/*";
  currentUrl: null | string;
  endpoint: "imageUploader" | "videoUploader";
  helperText: string;
  icon: React.ReactNode;
  label: string;
  name: string;
  onChange: (url: string) => void;
}

export function HomepageSettingsPageClient({ settings }: HomepageSettingsPageClientProps) {
  const [state, formAction, isPending] = useActionState<
    HomepageSettingsFormState,
    FormData
  >(updateHomepageSettingsAction, {});

  const [heroVideoUrl, setHeroVideoUrl] = useState(settings.heroVideoUrl ?? "");
  const [heroVideoPoster, setHeroVideoPoster] = useState(settings.heroVideoPoster ?? "");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Homepage Settings</h2>
        <p className="text-sm text-muted-foreground">
          Control all homepage content including hero video, titles, and featured products section.
        </p>
      </div>

      <form action={formAction} className="space-y-8">
        <Tabs className="space-y-6" defaultValue="hero">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="featured">Featured Products</TabsTrigger>
            <TabsTrigger value="cta">CTA Section</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="hero">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Hero Video</h3>
              <p className="text-sm text-muted-foreground">
                Upload a video file or provide a direct video URL (MP4, WebM). The video will play
                muted, looped, and auto-play in the hero section.
              </p>

              <MediaField
                accept="video/*"
                currentUrl={heroVideoUrl}
                endpoint="videoUploader"
                helperText="Video file (MP4, WebM). Max 64MB. Auto-plays muted and looped."
                icon={<Video className="h-4 w-4" />}
                label="Hero Video"
                name="heroVideoUrl"
                onChange={setHeroVideoUrl}
              />

              <MediaField
                accept="image/*"
                currentUrl={heroVideoPoster}
                endpoint="imageUploader"
                helperText="Poster image shown before video loads. Recommended 1920x1080."
                icon={<ImageIcon className="h-4 w-4" />}
                label="Video Poster"
                name="heroVideoPoster"
                onChange={setHeroVideoPoster}
              />
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Hero Text</h3>

              <div className="space-y-1.5">
                <Label htmlFor="heroTitle">Main Title</Label>
                <Input
                  defaultValue={settings.heroTitle}
                  id="heroTitle"
                  name="heroTitle"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="heroSubtitle">Subtitle</Label>
                <textarea
                  className={textareaClassName}
                  defaultValue={settings.heroSubtitle}
                  id="heroSubtitle"
                  name="heroSubtitle"
                  required
                  rows={3}
                />
              </div>

              <div className={`
                grid gap-4
                sm:grid-cols-2
              `}>
                <div className="space-y-1.5">
                  <Label htmlFor="heroCtaText">CTA Button Text</Label>
                  <Input
                    defaultValue={settings.heroCtaText}
                    id="heroCtaText"
                    name="heroCtaText"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heroCtaHref">CTA Button Link</Label>
                  <Input
                    defaultValue={settings.heroCtaHref}
                    id="heroCtaHref"
                    name="heroCtaHref"
                    required
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="collections">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Collections Section</h3>

              <div className="space-y-1.5">
                <Label htmlFor="collectionsTitle">Section Title</Label>
                <Input
                  defaultValue={settings.collectionsTitle}
                  id="collectionsTitle"
                  name="collectionsTitle"
                  required
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="featured">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Featured Products Section</h3>
              <p className="text-sm text-muted-foreground">
                Products marked as "Featured" in the Products admin will appear here. You can manage
                which products are featured from the Products page.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="featuredTitle">Section Title</Label>
                <Input
                  defaultValue={settings.featuredTitle}
                  id="featuredTitle"
                  name="featuredTitle"
                  required
                />
              </div>

              <div className={`
                grid gap-4
                sm:grid-cols-2
              `}>
                <div className="space-y-1.5">
                  <Label htmlFor="featuredCtaText">CTA Button Text</Label>
                  <Input
                    defaultValue={settings.featuredCtaText}
                    id="featuredCtaText"
                    name="featuredCtaText"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="featuredCtaHref">CTA Button Link</Label>
                  <Input
                    defaultValue={settings.featuredCtaHref}
                    id="featuredCtaHref"
                    name="featuredCtaHref"
                    required
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="cta">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Testimonials Section</h3>

              <div className="space-y-1.5">
                <Label htmlFor="testimonialsTitle">Section Title</Label>
                <Input
                  defaultValue={settings.testimonialsTitle}
                  id="testimonialsTitle"
                  name="testimonialsTitle"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="testimonialsDescription">Section Description</Label>
                <textarea
                  className={textareaClassName}
                  defaultValue={settings.testimonialsDescription}
                  id="testimonialsDescription"
                  name="testimonialsDescription"
                  required
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Bottom CTA Section</h3>

              <div className="space-y-1.5">
                <Label htmlFor="ctaTitle">Section Title</Label>
                <Input
                  defaultValue={settings.ctaTitle}
                  id="ctaTitle"
                  name="ctaTitle"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ctaDescription">Section Description</Label>
                <textarea
                  className={textareaClassName}
                  defaultValue={settings.ctaDescription}
                  id="ctaDescription"
                  name="ctaDescription"
                  required
                  rows={2}
                />
              </div>

              <div className={`
                grid gap-4
                sm:grid-cols-2
              `}>
                <div className="space-y-1.5">
                  <Label htmlFor="ctaPrimaryText">Primary Button Text</Label>
                  <Input
                    defaultValue={settings.ctaPrimaryText}
                    id="ctaPrimaryText"
                    name="ctaPrimaryText"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ctaPrimaryHref">Primary Button Link</Label>
                  <Input
                    defaultValue={settings.ctaPrimaryHref}
                    id="ctaPrimaryHref"
                    name="ctaPrimaryHref"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ctaSecondaryText">Secondary Button Text</Label>
                  <Input
                    defaultValue={settings.ctaSecondaryText}
                    id="ctaSecondaryText"
                    name="ctaSecondaryText"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ctaSecondaryHref">Secondary Button Link</Label>
                  <Input
                    defaultValue={settings.ctaSecondaryHref}
                    id="ctaSecondaryHref"
                    name="ctaSecondaryHref"
                    required
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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

function MediaField({
  accept,
  currentUrl,
  endpoint,
  helperText,
  icon,
  label,
  name,
  onChange,
}: MediaFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </Label>
      <div className="flex items-center gap-3">
        {currentUrl && (
          <div className={`
            relative h-16 w-28 shrink-0 overflow-hidden rounded-md border
            bg-muted
          `}>
            {accept.startsWith("video") ? (
              <video
                autoPlay
                className="h-full w-full object-cover"
                loop
                muted
                playsInline
                src={currentUrl}
              />
            ) : (
              <img
                alt={label}
                className="h-full w-full object-cover"
                src={currentUrl}
              />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            accept={accept}
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
            endpoint={endpoint}
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