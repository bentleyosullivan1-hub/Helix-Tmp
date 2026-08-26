import { access, readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const root = process.cwd();
const topLevelPages = ["index.html", "about.html", "games.html", "lab.html", "viewer.html"];
const failures = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

function localReferences(html) {
  const references = [];
  const pattern = /(?:href|src)=["']([^"'#?]+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const value = match[1].trim();
    if (!/^(?:[a-z][a-z+.-]*:|\/\/|#)/i.test(value)) references.push(value);
  }
  return references;
}

for (const page of topLevelPages) {
  const pagePath = resolve(root, page);
  if (!(await exists(pagePath))) {
    failures.push(`Missing required page: ${page}`);
    continue;
  }
  const html = await readFile(pagePath, "utf8");
  for (const reference of localReferences(html)) {
    const target = resolve(root, reference.replaceAll("/", sep));
    if (!relative(root, target).startsWith("..") && !(await exists(target))) {
      failures.push(`${page} references a missing local file: ${reference}`);
    }
  }
}

const manifestPath = resolve(root, "games", "list.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const names = new Set();
for (const game of manifest) {
  if (!game?.file || !game?.title) failures.push("Every games/list.json entry needs both file and title.");
  if (names.has(game.file)) failures.push(`Duplicate game manifest entry: ${game.file}`);
  names.add(game.file);
  if (!(await exists(resolve(root, "games", game.file)))) failures.push(`Game listed but missing: games/${game.file}`);
}

const listedGames = new Set(manifest.map(game => game.file));
for (const file of await filesUnder(resolve(root, "games"))) {
  if ((await stat(file)).isFile() && /\.html?$/i.test(file)) {
    const gameFile = relative(resolve(root, "games"), file).replaceAll(sep, "/");
    if (!listedGames.has(gameFile)) failures.push(`Game exists but is absent from games/list.json: games/${gameFile}`);
  }
}

if (failures.length) {
  console.error("Site verification failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Verified ${topLevelPages.length} pages and ${manifest.length} games.`);
