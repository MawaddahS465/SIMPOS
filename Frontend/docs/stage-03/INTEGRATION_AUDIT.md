# STAGE 03 — Integration Audit (Checkpoint 0)

Tanggal: 11 Okt 2026. Metode: baca source aktual + uji browser. Tanpa Git di mesin ini
(backup: `backup-src-stage03.zip` di temp opencode; rollback = ekstrak kembali ke `src/`).

## 1. Arsitektur terdeteksi

Frontend-only: React 18 + TS + Vite 5, react-router 6, Lucide, CSS per-file. **Tanpa backend,
tanpa database server.** Satu-satunya persistence: `localStorage` (demo, satu browser).
Implikasi jujur: sinkronisasi hanya dalam browser yang sama; bukan integrasi multi-perangkat
dan bukan RBAC production. Tidak ada migrasi stack (sesuai perintah).

## 2. Matriks fitur existing (terverifikasi dari kode + tes browser)

| Area | Status | Sumber data |
|---|---|---|
| Kasir login/dashboard/transaksi/checkout/riwayat/pelanggan/resep/pembayaran | ✅ fungsional | `catalog.ts`, `customers.ts`, `mock.ts` (statis) |
| Admin login/dashboard/produk/stok (Tahap 01) | ✅ fungsional | `sharedStore.tsx` + `localStorage simpos.shared.v2` |
| Admin penerimaan/distribusi/pengajuan/PO/mutasi (Tahap 02) | ✅ fungsional | sama (satu store) |
| Kasir↔Admin: katalog, PO, stok, mutasi, riwayat | ✅ satu store | `SharedProvider` di root; UAT 15/15 Tahap 02 |
| Sesi Kasir | ❌ gap — login tanpa sesi | diperbaiki Tahap 03 (sesi bersama) |
| Guard rute Kasir | ❌ gap — direct URL bebas | diperbaiki Tahap 03 (`KasirGuard`) |
| Guard rute Admin | ✅ ada | `AdminGuard` (klien/demo) |
| Kasir buat PO | ❌ gap — tombol hanya notice | dibangun Tahap 03 (INT-07) |
| Penyelesaian PO (Selesai) | ⚠️ ambigu PRD | ditandai `NEEDS_CLIENT_APPROVAL` |
| Multi-cabang / RBAC server / gateway | ❌ tidak ada | BLOCKED — butuh backend |

## 3. Celah integrasi → perlakuan Tahap 03

1. Sesi bersama + redirect role + guard dua arah (CP1; demo-level, bukan keamanan server).
2. `createPO` Kasir + snapshot resep (CP2); tombol Selesai Kasir = disabled + tag persetujuan (CP2).
3. Verifikasi stok saat checkout + blokir over-stock (CP3); idempotency payment-retry test (CP3).
4. Matriks INT-01…INT-24 otomatis + regresi visual 12 layar (CP4–CP5).

## 4. Risiko regresi & mitigasi

- Guard Kasir mengubah akses direct-URL (disengaja; login demo 1 klik, skrip UAT di-update).
- `createPO` menambah drawer di halaman PO Kasir (komponen `.drawer` existing; gaya tak berubah).
- Blokir over-stock di checkout memakai `.notice` existing (tanpa elemen visual baru).
- Rollback: backup zip + store key `simpos.shared.v2` tak diubah formatnya (aditif saja).
