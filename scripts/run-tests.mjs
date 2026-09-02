import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { build } from "vite";

const outputDirectory = await mkdtemp(join(tmpdir(), "home-checklist-tests-"));

try {
  await build({
    configFile: false,
    logLevel: "silent",
    // UI regression tests run from a temporary directory without node_modules.
    ssr: { noExternal: ["react", "react-dom"] },
    build: {
      ssr: resolve("tests/catalog.test.ts"),
      outDir: outputDirectory,
      emptyOutDir: true,
      target: "node22",
      rollupOptions: { output: { entryFileNames: "catalog.test.mjs" } },
    },
  });

  const exitCode = await new Promise((resolveExitCode, reject) => {
    const child = spawn(process.execPath, ["--test", join(outputDirectory, "catalog.test.mjs")], { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => resolveExitCode(code ?? 1));
  });
  if (exitCode !== 0) process.exitCode = exitCode;
} finally {
  await rm(outputDirectory, { recursive: true, force: true });
}
