import { gzipSync } from "node:zlib";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function gzipStaticAssets(): Plugin {
  return {
    name: "nova-gzip-static-assets",
    apply: "build",
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (!/\.(?:js|css)$/.test(asset.fileName)) continue;
        const source = asset.type === "chunk" ? asset.code : asset.source;
        this.emitFile({
          type: "asset",
          fileName: asset.fileName + ".gz",
          source: gzipSync(Buffer.from(source), { level: 9 }),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), gzipStaticAssets()],
  server: { port: 4173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: { output: { manualChunks: { react: ["react", "react-dom"] } } },
  },
});
