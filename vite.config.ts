import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig(() => ({
  root: __dirname,
  envDir: __dirname,
  base: "./",
  server: {
    host: "::",
    port: 8085,
    watch: {
      usePolling: true,
      interval: 500,
      ignored: [
        "**/dist/**",
        "**/dist-*/**",
        "**/coverage/**",
        "**/.vercel/**",
        "**/release/**",
      ],
    },
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
