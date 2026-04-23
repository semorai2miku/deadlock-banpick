import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const isStandalone = mode === "standalone";

  return {
    base: isStandalone ? "./" : "/",
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      fs: {
        allow: [path.resolve(__dirname, "..")],
      },
    },
    build: {
      outDir: isStandalone ? "dist-standalone" : "dist",
      emptyOutDir: true,
    },
  };
});
