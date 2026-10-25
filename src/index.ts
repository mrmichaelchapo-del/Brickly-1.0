import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  BlockDefinition,
  BlockCategory,
  BlockShape,
} from "../blocks/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const blocksDir = path.join(rootDir, "blocks");

const CATEGORY_ORDER: BlockCategory[] = [
  "Motion",
  "Looks",
  "Sounds",
  "Events",
  "Controls",
  "Operators",
  "Variables",
  "Lists",
];

const SHAPE_ICON: Record<BlockShape, string> = {
  hat: "🎩",
  command: "🟠",
  reporter: "🔵",
};

function loadBlocksFromDir(dir: string): BlockDefinition[] {
  if (!fs.existsSync(dir)) {
    console.warn(`[brickly] No blocks directory at ${dir}`);
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const blocks: BlockDefinition[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          validateBlock(entry, file);
          blocks.push(entry as BlockDefinition);
        }
      } else {
        validateBlock(parsed, file);
        blocks.push(parsed as BlockDefinition);
      }
    } catch (err) {
      console.error(`[brickly] Failed to load ${file}:`, err);
    }
  }

  return blocks;
}

function validateBlock(candidate: unknown, source: string): void {
  if (typeof candidate !== "object" || candidate === null) {
    throw new Error(`Invalid block in ${source}: not an object`);
  }
  const b = candidate as Record<string, unknown>;
  const required = ["id", "name", "category", "label", "shape", "description"];
  for (const key of required) {
    if (typeof b[key] !== "string") {
      throw new Error(`Invalid block in ${source}: missing/invalid "${key}"`);
    }
  }
  const validShapes: BlockShape[] = ["hat", "command", "reporter"];
  if (!validShapes.includes(b.shape as BlockShape)) {
    throw new Error(`Invalid shape "${String(b.shape)}" in ${source}`);
  }
}

function groupByCategory(
  blocks: BlockDefinition[],
): Map<BlockCategory, BlockDefinition[]> {
  const grouped = new Map<BlockCategory, BlockDefinition[]>();
  for (const category of CATEGORY_ORDER) {
    grouped.set(category, []);
  }
  for (const block of blocks) {
    const bucket = grouped.get(block.category);
    if (bucket) {
      bucket.push(block);
    } else {
      console.warn(
        `[brickly] Block "${block.id}" has unknown category "${block.category}"`,
      );
    }
  }
  return grouped;
}

function printSummary(blocks: BlockDefinition[]): void {
  const grouped = groupByCategory(blocks);

  console.log("🧱 Brickly-1.0");
  console.log(`📦 ${blocks.length} blocks loaded from ${blocksDir}\n`);

  for (const category of CATEGORY_ORDER) {
    const inCategory = grouped.get(category) ?? [];
    if (inCategory.length === 0) continue;

    const hats = inCategory.filter((b) => b.shape === "hat").length;
    const commands = inCategory.filter((b) => b.shape === "command").length;
    const reporters = inCategory.filter((b) => b.shape === "reporter").length;

    console.log(
      `${category} (${inCategory.length}) — 🎩${hats} 🟠${commands} 🔵${reporters}`,
    );

    for (const block of inCategory) {
      const icon = SHAPE_ICON[block.shape];
      const args = block.args?.length ? ` [${block.args.join(", ")}]` : "";
      console.log(`  ${icon} ${block.label}${args} — ${block.description}`);
    }
    console.log("");
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const mode = args[0] ?? "summary";

  const blocks = loadBlocksFromDir(blocksDir);

  if (blocks.length === 0) {
    console.warn("⚠️  No blocks found. Run `npm run generate` first.");
    process.exitCode = 1;
    return;
  }

  switch (mode) {
    case "summary":
      printSummary(blocks);
      break;
    case "json":
      console.log(JSON.stringify(blocks, null, 2));
      break;
    case "count":
      console.log(blocks.length);
      break;
    default:
      console.log("Usage: node dist/src/index.js [summary|json|count]");
      process.exitCode = 1;
  }
}

main();