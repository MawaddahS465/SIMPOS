# 01 — Environment Readiness (fakta pemeriksaan 12 Okt 2026, read-only)

| Komponen | Status | Bukti / solusi (tanpa eksekusi) |
|---|---|---|
| Node.js 24.21.0 + npm 11.19 | READY | `node --version`, dev :5173 jalan |
| React 18 + TS + Vite 5 + deps | READY | `package.json`, `node_modules` ada, typecheck bersih |
| Dev server :5173 | READY | HTTP 200 |
| Port Supabase lokal (54321/54322) | READY | bebas (belum dibutuhkan) |
| Git / version control | NOT READY | `git` tidak ada → instal Git for Windows; backup zip per tahap tetap berlaku |
| Supabase CLI | NOT READY | tidak ada → `npm i -g supabase` / binary resmi (saat disetujui) |
| Docker / psql | NOT READY | tidak ada; tidak wajib bila pakai hosted project |
| `.env` / supabase config | READY (bersih) | tidak ada file; JANGAN buat sebelum disetujui |
| OS Windows 10/11 + PowerShell | READY | cocok untuk dev lokal + hosted Supabase |

Baseline 99/99 diulang tahap ini (bukti di `07_*`). Tanpa instal/update/delete apa pun.
