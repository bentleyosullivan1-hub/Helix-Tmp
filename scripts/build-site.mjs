import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
const publishPaths = [
  "index.html",
  "about.html",
  "games.html",
  "lab.html",
  "viewer.html",
  "helix.jpg",
  "register-sw.js",
  "sw.js",
  "css",
  "js",
  "games"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const source of publishPaths) {
  await cp(resolve(root, source), resolve(output, source), { recursive: true });
}

// Prevent Jekyll from processing directories or filenames used by the games.
await writeFile(resolve(output, ".nojekyll"), "");
