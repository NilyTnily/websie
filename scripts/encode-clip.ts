import { execFileSync } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

const [, , inputPath, outputPath, widthArg] = process.argv;

if (!inputPath || !outputPath) {
  throw new Error("Usage: bun scripts/encode-clip.ts <input.mp4> <output.mp4> [scaleWidth]");
}

if (!ffmpegPath) {
  throw new Error("ffmpeg-static did not resolve a binary path");
}

const gop = widthArg ? "4" : "8";
const crf = widthArg ? "23" : "20";
const vf = widthArg
  ? `scale=${widthArg}:-2,unsharp=5:5:0.8:5:5:0.0`
  : "unsharp=5:5:0.8:5:5:0.0";

const args = [
  "-i", inputPath,
  "-an",
  "-vf", vf,
  "-c:v", "libx264",
  "-preset", "slow",
  "-crf", crf,
  "-pix_fmt", "yuv420p",
  "-g", gop,
  "-keyint_min", gop,
  "-sc_threshold", "0",
  "-movflags", "+faststart",
  "-y",
  outputPath,
];

execFileSync(ffmpegPath, args, { stdio: "inherit" });
