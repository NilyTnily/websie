"use client";

import { Film, Plus, RotateCw, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { UploadButton } from "~/lib/uploadthing";
import { Label } from "~/ui/primitives/label";

type MediaType = "360" | "image" | "video";

let nextRowId = 0;
interface GalleryRow {
  id: string;
  mediaType: MediaType;
  url: string;
}

interface ProductGalleryEditorProps {
  defaultMedia: { mediaType: MediaType; url: string }[];
}

export function ProductGalleryEditor({
  defaultMedia,
}: ProductGalleryEditorProps) {
  const [rows, setRows] = React.useState<GalleryRow[]>(() =>
    defaultMedia.map((item) => ({ id: makeRowId(), ...item })),
  );

  const galleryImagesValue = JSON.stringify(
    rows.map(({ mediaType, url }) => ({ mediaType, url })),
  );

  const addRows = (mediaType: MediaType, urls: string[]) => {
    setRows((prev) => [
      ...prev,
      ...urls.map((url) => ({ id: makeRowId(), mediaType, url })),
    ]);
  };

  return (
    <div className="space-y-4 border-t pt-6">
      <div>
        <Label>Additional Media</Label>
        <p className="text-xs text-muted-foreground">
          Shown on the product page gallery, in addition to the cover image
          above. 360° frames must be uploaded in rotation order — there&apos;s
          no drag-reorder yet.
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
              className={`
                group relative aspect-square overflow-hidden rounded-md border
                bg-muted
              `}
              key={row.id}
            >
              {row.mediaType === "video" ? (
                <video className="h-full w-full object-cover" muted src={row.url} />
              ) : (
                <Image
                  alt="Gallery media"
                  className="object-cover"
                  fill
                  sizes="120px"
                  src={row.url}
                />
              )}
              {row.mediaType !== "image" && (
                <span
                  className={`
                    absolute top-1 left-1 flex items-center gap-1 rounded
                    bg-black/60 px-1.5 py-0.5 text-[10px] text-white uppercase
                  `}
                >
                  {row.mediaType === "video" ? (
                    <Film className="h-3 w-3" />
                  ) : (
                    <RotateCw className="h-3 w-3" />
                  )}
                  {row.mediaType}
                </span>
              )}
              <button
                aria-label="Remove media"
                className={`
                  absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white
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

      <div className="flex flex-wrap gap-2">
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
          onClientUploadComplete={(res) =>
            addRows(
              "image",
              res.filter((f) => f.ufsUrl).map((f) => f.ufsUrl),
            )
          }
          onUploadError={(uploadError: Error) => {
            toast.error(`Upload failed: ${uploadError.message}`);
          }}
        />

        <UploadButton
          appearance={{ button: "h-8 px-3 text-xs" }}
          content={{
            button: (
              <>
                <Film className="h-3.5 w-3.5" />
                Add video
              </>
            ),
          }}
          endpoint="videoUploader"
          onClientUploadComplete={(res) =>
            addRows(
              "video",
              res.filter((f) => f.ufsUrl).map((f) => f.ufsUrl),
            )
          }
          onUploadError={(uploadError: Error) => {
            toast.error(`Upload failed: ${uploadError.message}`);
          }}
        />

        <UploadButton
          appearance={{ button: "h-8 px-3 text-xs" }}
          content={{
            button: (
              <>
                <RotateCw className="h-3.5 w-3.5" />
                Add 360° sequence
              </>
            ),
          }}
          endpoint="sequenceUploader"
          onClientUploadComplete={(res) =>
            addRows(
              "360",
              res.filter((f) => f.ufsUrl).map((f) => f.ufsUrl),
            )
          }
          onUploadError={(uploadError: Error) => {
            toast.error(`Upload failed: ${uploadError.message}`);
          }}
        />
      </div>

      <input name="galleryImages" type="hidden" value={galleryImagesValue} />
    </div>
  );
}

function makeRowId(): string {
  nextRowId += 1;
  return `gallery-row-${nextRowId}`;
}
