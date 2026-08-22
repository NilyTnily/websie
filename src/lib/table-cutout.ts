import "server-only";
import { UTApi } from "uploadthing/server";

import type { MutationResult } from "~/lib/queries/catalog-admin";

const utapi = new UTApi();

// Background removal runs self-hosted (@imgly/background-removal-node, an
// ONNX model executed in this server process) — no external API, no
// per-image cost. The only network call is persisting the resulting PNG to
// UploadThing, the same storage the rest of the admin's image uploads use.
export async function generateTableCutout(
  productId: string,
  sourceImageUrl: string,
): Promise<MutationResult<{ url: string }>> {
  try {
    // Dynamic import so `sharp`/`onnxruntime-node` native bindings are not
    // evaluated during `next build` page-data collection — they are only
    // loaded at runtime when an admin actually triggers a cutout.
    const { removeBackground } = await import(
      "@imgly/background-removal-node"
    );
    const blob = await removeBackground(sourceImageUrl);
    const buffer = Buffer.from(await blob.arrayBuffer());
    // Native File, not UploadThing's own UTFile helper — UTFile assigns
    // `this.name` in its constructor, which throws under Bun's runtime
    // (File#name is a read-only getter there). uploadFiles() accepts a
    // native File directly per UploadThing's own docs; UTFile only exists
    // for environments lacking a global File, which Bun has natively.
    const file = new File([buffer], `${productId}-table-cutout.png`, {
      type: "image/png",
    });

    const { data, error } = await utapi.uploadFiles(file);
    if (error) {
      return { error: error.message, success: false };
    }
    return { data: { url: data.ufsUrl }, success: true };
  } catch (error) {
    console.error("Failed to generate table cutout:", error);
    return {
      error: "Could not remove the background from that product's photo.",
      success: false,
    };
  }
}
