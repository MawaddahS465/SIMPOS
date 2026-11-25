import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Hosting gratis (InfinityFree) menghapus otomatis berkas .js yang lebih dari
// 1 MB, jadi pustaka besar dan halaman dipisah menjadi beberapa berkas.
function manualChunks(id: string): string | undefined {
  const path = id.replace(/\\/g, "/");
  if (path.includes("node_modules")) {
    if (path.includes("react-router")) return "vendor-router";
    if (path.includes("lucide-react")) return "vendor-icons";
    if (path.includes("xlsx")) return "vendor-xlsx";
    if (path.includes("jspdf") || path.includes("html2canvas") || path.includes("dompurify")) return "vendor-pdf";
    if (path.includes("/react/") || path.includes("/react-dom/") || path.includes("/scheduler/")) return "vendor-react";
    return "vendor";
  }
  if (path.includes("/src/pages/owner/")) return "pages-owner";
  if (path.includes("/src/pages/admin/")) return "pages-admin";
  if (path.includes("/src/pages/")) return "pages-kasir";
  if (path.includes("/src/store/")) return "store";
  if (path.includes("/src/data/")) return "data";
  return undefined;
}

// Hasil build dipublikasikan langsung ke Backend/public/app sehingga satu
// alamat (backend) melayani halaman sekaligus API. Saat `npm run dev`, Vite
// tetap di root dan meneruskan /api ke backend.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  build: {
    outDir: "../Backend/public/app",
    emptyOutDir: true,
    rollupOptions: {
      output: { manualChunks },
    },
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
