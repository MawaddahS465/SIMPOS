# 01 — Kesiapan Git & Backup (rencana, tanpa eksekusi)

Lokasi: `C:\Users\lenovo\Documents\Default Project\simpos-optik\` (prototype + docs
stage-03…08 + QA + backup zip per tahap di temp). Folder penting: `src/`,
`public/`, `docs/`, `qa/`, `package.json`, `*.md` root.

## Instalasi Git (Windows, saat diizinkan)

`winget install --id Git.Git -e` (atau installer resmi git-scm.com), verifikasi
`git --version`, konfigurasi `user.name/user.email` lokal. Tanpa init/commit tahap ini.

## `.gitignore` rancangan (Vite/React/TS + rahasia)

```
node_modules/
dist/
*.local
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
*.log
coverage/
```

## Backup ZIP pra-Git + restore terbukti

1. ZIP seluruh repo (termasuk `node_modules`? TIDAK — kecuali `package-lock` + docs;
   sebutkan flag). 2. Simpan 2 salinan (lokal + eksternal). 3. Uji restore: ekstrak ke
   folder sementara → `npm ci` → `npm run dev` → smoke 3 login → screenshot.
4. Baru `git init` + commit awal setelah restore TERBUKTI. Sensitif: repo privat;
   pindai `password/token/secret/key` sebelum commit (saat ini: tidak ada secret di repo).
