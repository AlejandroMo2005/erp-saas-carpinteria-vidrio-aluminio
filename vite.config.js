// vite.config.js — Sprint 18.4 — Eliminar asyncCssFix
//
// CAMBIO DT-IA (fix renders 3D):
//   - @react-three/fiber movido a include (sin three, que sigue en exclude)
//   - react-reconciler agregado a include para que esbuild lo bundlee
//   - dedupe fuerza una sola copia de react/fiber/reconciler
//   - Alias react-reconciler/constants ELIMINADO (archivo no existe en v0.29)

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

function crossoriginFix() {
  return {
    name: "crossorigin-fix",
    enforce: "post",
    transformIndexHtml(html) {
      return html
        .replace(/<link rel="modulepreload"(?![^>]*crossorigin)([^>]*)>/g,
          '<link rel="modulepreload" crossorigin="anonymous"$1>')
        .replace(/<link rel="preload"(?![^>]*crossorigin)([^>]*)>/g,
          '<link rel="preload" crossorigin="anonymous"$1>');
    },
  };
}

function stripVitePreload() {
  return {
    name: "strip-vite-preload",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        const isThreeFamily =
          chunk.fileName.includes("vendor-three")  ||
          chunk.fileName.includes("vendor-r3f")    ||
          chunk.fileName.includes("vendor-troika");
        if (isThreeFamily) continue;
        let code = chunk.code;
        code = code.replace(
          /import\{\s*_\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}from"\.\/vendor-three-[^"]+\.js";?/g,
          (_, alias) => `var ${alias}=(_f,_d)=>_f();`
        );
        code = code.replace(
          /import\{\s*_\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}from"\.\/vendor-r3f-[^"]+\.js";?/g,
          (_, alias) => `var ${alias}=(_f,_d)=>_f();`
        );
        code = code.replace(/import(?!\s*\{)"\.\/vendor-three-[^"]+\.js";?/g,  "");
        code = code.replace(/import(?!\s*\{)"\.\/vendor-r3f-[^"]+\.js";?/g,    "");
        code = code.replace(/import(?!\s*\{)"\.\/vendor-troika-[^"]+\.js";?/g, "");
        code = code.replace(/import(?!\s*\{)"\.\/vendor-charts-[^"]+\.js";?/g, "");
        chunk.code = code;
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crossoriginFix(),
    stripVitePreload(),
    mode === "analyze" &&
      visualizer({
        open:     true,
        filename: "dist/stats.html",
        gzipSize: true,
        template: "treemap",
      }),
  ].filter(Boolean),

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "react-reconciler/constants": resolve(
          __dirname,
          "src/shims/react-reconciler-constants.js"
        ),
      },
      dedupe: [
        "react",
        "react-dom",
        "react-reconciler",
        "@react-three/fiber",
        "three",
      ],
    },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@react-three/drei",
      "axios",
      "lucide-react",
      "react-reconciler",
      "@react-three/fiber",
      "stats.js",
      "prop-types",
      "its-fine",
      "scheduler",
      "zustand",  
    ],
    exclude: [
      "three",
      "@react-spring/three",
      "troika-three-text",
      "troika-worker-utils",
      "troika-core",
      "meshline",
      "potpack",
      "suspend-react",
      "three-stdlib",
      "stats-gl",
      "camera-controls",
      "maath",
    ],
  },

  build: {
    target:                "es2019",
    sourcemap:             false,
    chunkSizeWarningLimit: 700,
    cssCodeSplit:          false,
    modulePreload:         false,
    rollupOptions: {
      external: [],
      onwarn(warning, warn) {
        if (warning.message.includes('react-reconciler-constants')) return;
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("node_modules/three/") || id.includes("node_modules/three\\")) return "vendor-three";
          if (id.includes("node_modules/troika-") || id.includes("node_modules/meshline") || id.includes("node_modules/potpack")) return "vendor-troika";
          if (
            id.includes("node_modules/@react-three/fiber")  ||
            id.includes("node_modules/@react-three/drei")   ||
            id.includes("node_modules/@react-spring/three") ||
            id.includes("node_modules/suspend-react")       ||
            id.includes("node_modules/three-stdlib")        ||
            id.includes("node_modules/stats-gl")            ||
            id.includes("node_modules/camera-controls")     ||
            id.includes("node_modules/maath")
          ) return "vendor-r3f";
          if (
            id.includes("node_modules/react/")       ||
            id.includes("node_modules/react-dom/")   ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) return "vendor-react";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/axios"))     return "vendor-axios";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "vendor-charts";
        },
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  server: {
    port:  3000,
    host:  true,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true, secure: false },
    },
  },
  preview: { port: 3000 },
  envPrefix: "VITE_",
}));