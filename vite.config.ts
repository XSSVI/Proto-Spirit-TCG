// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import deno from "@deno/vite-plugin";
import "react";
import "react-dom";

export default defineConfig({
  root: "./client",
  server: {
    port: 3000, // Your React frontend runs on localhost:3000
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Backend server
        changeOrigin: true,
        secure: false, // Avoid HTTPS problems in local dev
        ws: true, // Enable WebSocket proxying
      },
    },
    hmr: {
      timeout: 5000, // Increase timeout to 5 seconds
      clientPort: 3000, // Ensure consistent port
      overlay: false, // Disable error overlay which might trigger reconnections
    },
  },
  plugins: [
    react(),
    deno(),
  ],
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
});