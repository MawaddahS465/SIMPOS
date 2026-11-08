import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Hasil build dipublikasikan langsung ke Backend/public/app sehingga satu
// alamat (backend) melayani halaman sekaligus API. Saat `npm run dev`, Vite
// tetap di root dan meneruskan /api ke backend.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  build: {
    outDir: "../Backend/public/app",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1", // ikat ke IPv4 saja agar cloudflared tidak gagal dial ::1
    port: 5173,
    strictPort: true,
    allowedHosts: true, // izinkan akses via tunnel publik (trycloudflare) untuk demo
    // Teruskan /api ke backend CI4. Request jadi same-origin: tidak ada
    // preflight CORS dan cookie session tetap first-party.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
}));
