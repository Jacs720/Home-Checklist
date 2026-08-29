import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const tauriDevHost = loadEnv(mode, ".", "").TAURI_DEV_HOST;

  return {
  base: "./",
  clearScreen: false,
  css: { postcss: { plugins: [] } },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  plugins: [react()],
  server: {
    host: tauriDevHost || false,
    port: 5173,
    strictPort: true,
    hmr: tauriDevHost ? { protocol: "ws", host: tauriDevHost, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  };
});
