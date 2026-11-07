# DEPLOYMENT READINESS — Checkpoint 4

Status sistem: **prototype frontend siap demo**, BUKAN production-ready.

| Komponen | Status | Keterangan |
|---|---|---|
| Build/dev (`vite`, typecheck) | READY | typecheck bersih; dev 200 OK |
| Backend / database | BLOCKED | belum ada; kontrak data siap di `docs/stage-03/DATA_CONTRACT.md` |
| Migrasi data (seed → DB) | NOT IMPLEMENTED | seed terkonsolidasi di `sharedStore.seed()` |
| Env variables | NOT IMPLEMENTED | tanpa secret apa pun saat ini |
| HTTPS | BLOCKED | dev HTTP localhost |
| Auth production | BLOCKED | lihat SECURITY_AUDIT |
| Payment gateway | NOT IMPLEMENTED | tunai/transfer/QRIS = label demo |
| Logging/monitoring error | NOT IMPLEMENTED | hanya console browser |
| Backup/restore | BLOCKED | ekspor XLSX/PDF = arsip manual, bukan backup DB |
| Recovery plan | NOT IMPLEMENTED | rollback = backup zip `src/` |

**Dilarang (sesuai mandat):** mengganti framework, membuat backend, memasang gateway,
atau deploy — menunggu keputusan teknis + persetujuan.
Jalankan: `npm install` → `npm run dev` → http://localhost:5173.
Demo: kasir@ / admin@ / owner@mekarjaya.demo, password `demo123` (label di tiap login).
