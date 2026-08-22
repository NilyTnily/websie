import { execFileSync } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

const [, , videoPath, position, outPath] = process.argv;

if (!videoPath || !outPath || (position !== "first" && position !== "last")) {
  throw new Error(
    "Usage: bun scripts/extract-frame.ts <video-path> <first|last> <out-path.png>",
  );
}

if (!ffmpegPath) {
  throw new Error("ffmpeg-static did not resolve a binary path");
}

// Matches scroll-world's seam-extraction commands: the -0.15s offset avoids
// grabbing a partially-decoded final frame.
const args =
  position === "last"
    ? ["-sseof", "-0.15", "-i", videoPath, "-frames:v", "1", "-q:v", "2", "-y", outPath]
    : ["-ss", "0", "-i", videoPath, "-frames:v", "1", "-q:v", "2", "-y", outPath];

execFileSync(ffmpegPath, args, { stdio: "inherit" });
