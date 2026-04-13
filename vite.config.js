import { fileURLToPath, URL } from "node:url";
import { gzipSync } from "node:zlib";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const formatBytes = (value) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} kB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const bundleStatsPlugin = () => ({
  name: "bundle-stats-report",
  apply: "build",
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle)
      .filter((asset) => asset.type === "chunk")
      .map((chunk) => ({
        fileName: chunk.fileName,
        name: chunk.name,
        rawSize: Buffer.byteLength(chunk.code),
        gzipSize: gzipSync(chunk.code).length,
        isEntry: chunk.isEntry,
      }))
      .sort((left, right) => right.gzipSize - left.gzipSize);

    const rows = chunks.map((chunk) => `
      <tr>
        <td>${chunk.fileName}</td>
        <td>${chunk.name}</td>
        <td>${chunk.isEntry ? "entry" : "async"}</td>
        <td>${formatBytes(chunk.rawSize)}</td>
        <td>${formatBytes(chunk.gzipSize)}</td>
      </tr>
    `).join("");

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bundle Stats</title>
    <style>
      body { background: #050505; color: #fff; font-family: Inter, Arial, sans-serif; margin: 0; padding: 32px; }
      h1 { margin: 0 0 8px; font-size: 32px; }
      p { color: rgba(255,255,255,.65); max-width: 720px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; overflow: hidden; }
      th, td { text-align: left; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.08); }
      th { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.55); }
      tr:last-child td { border-bottom: none; }
    </style>
  </head>
  <body>
    <h1>Bundle Stats</h1>
    <p>Chunk sizes from the latest Vite build. Gzip numbers are estimated from the emitted bundle code.</p>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Chunk</th>
          <th>Type</th>
          <th>Raw</th>
          <th>Gzip</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;

    this.emitFile({
      type: "asset",
      fileName: "stats.html",
      source: html,
    });
  },
});

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_", "TMDB_"],
  plugins: [react(), bundleStatsPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/node_modules/")) {
            if (
              normalizedId.includes("/react/") ||
              normalizedId.includes("/react-dom/") ||
              normalizedId.includes("/react-router-dom/") ||
              normalizedId.includes("/scheduler/") ||
              normalizedId.includes("/@tanstack/react-query/")
            ) {
              return "react-vendor";
            }

            if (
              normalizedId.includes("/@radix-ui/") ||
              normalizedId.includes("/lucide-react/") ||
              normalizedId.includes("/vaul/") ||
              normalizedId.includes("/cmdk/")
            ) {
              return "ui-vendor";
            }

            if (normalizedId.includes("/framer-motion/")) {
              return "motion";
            }

            if (
              normalizedId.includes("/@supabase/") ||
              normalizedId.includes("/@stripe/")
            ) {
              return "services-vendor";
            }

            if (normalizedId.includes("/react-quill/")) {
              return "editor";
            }

            if (normalizedId.includes("/three/")) {
              return "three";
            }

            if (
              normalizedId.includes("/react-leaflet/") ||
              normalizedId.includes("/leaflet/")
            ) {
              return "maps";
            }

            if (
              normalizedId.includes("/html2canvas/") ||
              normalizedId.includes("/jspdf/") ||
              normalizedId.includes("/lodash/") ||
              normalizedId.includes("/moment/") ||
              normalizedId.includes("/date-fns/")
            ) {
              return "utility-vendor";
            }
          }

          if (
            normalizedId.includes("/src/pages/Admin.jsx") ||
            normalizedId.includes("/src/pages/SocialHub.jsx") ||
            normalizedId.includes("/src/pages/SupportPage.jsx") ||
            normalizedId.includes("/src/pages/SpeedTestPage.jsx")
          ) {
            return "admin-social";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
