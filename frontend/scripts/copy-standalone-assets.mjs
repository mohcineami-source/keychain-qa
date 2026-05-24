/**
 * Post-build asset copy for Next.js `output: "standalone"`.
 *
 * `next build` writes:
 *   .next/standalone/   <- minimal node_modules + server.js
 *   .next/static/       <- hashed JS / CSS chunks
 *   public/             <- raw static assets
 *
 * The standalone server expects to find static + public INSIDE its own tree:
 *   .next/standalone/.next/static/
 *   .next/standalone/public/
 *
 * Easypanel/Nixpacks deploys run `npm run build` then `node .next/standalone/server.js`
 * directly — they do NOT use the Dockerfile, so this copy must happen at build time.
 * Without it, the live site loads as unstyled HTML because _next/static/* 404s.
 *
 * Uses fs.cpSync (Node 16.7+) so it works on both Windows (local) and Linux (deploy).
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const standaloneRoot = resolve(root, ".next/standalone");

if (!existsSync(standaloneRoot)) {
  console.warn(
    "[postbuild] .next/standalone does not exist — skipping copy. " +
      "Is `output: \"standalone\"` set in next.config.mjs?"
  );
  process.exit(0);
}

const tasks = [
  {
    label: ".next/static -> .next/standalone/.next/static",
    src: resolve(root, ".next/static"),
    dest: resolve(standaloneRoot, ".next/static"),
  },
  {
    label: "public -> .next/standalone/public",
    src: resolve(root, "public"),
    dest: resolve(standaloneRoot, "public"),
  },
];

for (const { label, src, dest } of tasks) {
  if (!existsSync(src)) {
    console.warn(`[postbuild] source missing, skipping: ${src}`);
    continue;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
  console.log(`[postbuild] copied ${label}`);
}

console.log("[postbuild] standalone assets ready");
