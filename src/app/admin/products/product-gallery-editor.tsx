"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import { Label } from "~/ui/primitives/label";

let nextRowId = 0;
function makeRowId(): string {
  nextRowId += 1;
  return `gallery-row-${nextRowId}`;
}

interface GalleryRow {
  id: string;
  url: string;
}

interface ProductGalleryEditorProps {
  defaultImages: string[];
}

export function ProductGalleryEditor({
  defaultImages,
}: ProductGalleryEditorProps) {
  const [rows, setRows] = React.useState<GalleryRow[]>(() =>
    defaultImages.map((url) => ({ id: makeRowId(), url })),
  );

  const galleryImagesValue = JSON.stringify(rows.map((row) => row.url));

  return (
    <div className="space-y-4 border-t pt-6">
      <div>
        <Label>Additional Photos</Label>
        <p className="text-xs text-muted-foreground">
          Shown on the product page as a gallery, in addition to the cover image
          above.
        </p>
      </div>

      {rows.length > 0 && (
        <div
          className={`
            grid grid-cols-3 gap-3
            sm:grid-cols-4
          `}
        >
          {rows.map((row) => (
            <div
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
              key={row.id}
            >
              <Image
                alt="Gallery photo"
                className="object-cover"
                fill
                sizes="120px"
                src={row.url}
              />
              <button
                aria-label="Remove photo"
                className={`
                  absolute top-1 right-1 rounded-full bg-black/60 p-1
                  text-white
                  hover:bg-black/80
                `}
                onClick={() =>
                  setRows((prev) => prev.filter((r) => r.id !== row.id))
                }
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <UploadButton
        appearance={{ button: "h-8 px-3 text-xs" }}
        content={{
          button: (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add photo
            </>
          ),
        }}
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          setRows((prev) => [
            ...prev,
            ...res
              .filter((file) => file.ufsUrl)
              .map((file) => ({ id: makeRowId(), url: file.ufsUrl })),
          ]);
        }}
        onUploadError={(uploadError: Error) => {
          toast.error(`Upload failed: ${uploadError.message}`);
        }}
      />

      <input name="galleryImages" type="hidden" value={galleryImagesValue} />
    </div>
  );
}
