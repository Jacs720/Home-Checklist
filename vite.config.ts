import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const tauriDevHost = process.env.TAURI_DEV_HOST;

export default defineConfig({
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
});
