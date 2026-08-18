import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Forward API and auth calls to deployed backend to avoid CORS during local dev
      "/auth": {
        target: "https://sps-accounts.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      "/api": {
        target: "https://sps-accounts.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});