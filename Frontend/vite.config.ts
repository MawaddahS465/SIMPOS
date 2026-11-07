import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1", // ikat ke IPv4 saja agar cloudflared tidak gagal dial ::1
    port: 5173,
    strictPort: true,
    allowedHosts: true, // izinkan akses via tunnel publik (trycloudflare) untuk demo
  },
});
