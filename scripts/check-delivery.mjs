import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import assert from "node:assert/strict";
const root = resolve(".");
const excluded = new Set([
  ".git",
  ".github",
  ".imd",
  ".agents",
  ".codex",
  ".aws",
  ".playwright-mcp",
  "node_modules",
  ".npm",
  ".cache",
  ".vite",
  "coverage",
]);
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name),
      rel = relative(root, path);
    if (
      excluded.has(entry.name) ||
      entry.name.startsWith(".env") ||
      rel === "test/scratch"
    )
      continue;
    assert.ok(!entry.isSymbolicLink(), `Link simbólico não esperado: ${rel}`);
    if (entry.isDirectory()) await walk(path);
    else files.push({ path: rel, bytes: (await stat(path)).size });
  }
}
await walk(root);
const max = 8388608,
  total = files.reduce((n, f) => n + f.bytes, 0);
assert.ok(total <= max, `Entrega excede 8 MiB: ${total}`);
assert.ok(
  (await stat(".gitignore")).size <= 512,
  "Orçamento de .gitignore excedido",
);
const html = await readFile("dist/index.html", "utf8");
assert.match(html, /<title>.+<\/title>/);
for (const name of ["description", "og:title", "og:image"])
  assert.ok(html.includes(`"${name}"`), `Metadado ausente: ${name}`);
assert.match(html, /rel="icon"/);
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  assert.ok(!url.startsWith("/"), `URL absoluta no export: ${url}`);
  if (url.startsWith("./")) await stat(resolve("dist", url));
}
await stat("dist/assets/compartilhar.png");
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
assert.deepEqual(lock.packages[""].dependencies, manifest.dependencies);
assert.deepEqual(lock.packages[""].devDependencies, manifest.devDependencies);
for (const path of ["README.md", "DESIGN.md", "artifacts/validation.md"])
  assert.ok(
    (await stat(path)).size > 200,
    `Documento ausente ou vazio: ${path}`,
  );
const groups = {};
for (const f of files) {
  const group = f.path.includes("/")
    ? f.path.split("/")[0] + "/"
    : "arquivos-raiz";
  groups[group] = (groups[group] || 0) + f.bytes;
}
const report = {
  limitBytes: max,
  totalBytes: total,
  remainingBytes: max - total,
  files: files.length,
  groups,
  largest: files.sort((a, b) => b.bytes - a.bytes).slice(0, 12),
  note: "Soma conservadora dos arquivos entregues, sem dependências, dados de entrada ou testes temporários; não mede o empacotamento do publicador.",
};
await writeFile(
  "artifacts/budget.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
