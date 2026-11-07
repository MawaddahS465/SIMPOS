# 03 — Policy Recommendations (BELUM DISETUJUI — proposal analis)

## R1. Penyelesaian PO (→ #1)
Alur usulan: `Sudah Datang` → Kasir verifikasi bayar + serah terima → `Selesai` (aktor Kasir,
waktu, catatan). Admin read-only pasca Sudah Datang. Alternatif: Admin-ajukan + Kasir-verifikasi
(dua kunci). Risiko dini: PO menggantung bila Kasir lupa — mitigasi: pengingat antrean.
Trade-off: satu aktor jelas vs fleksibilitas cabang sibuk.

## R2. Ledger pusat (→ #2, #3)
`on_hand_pusat` − reservasi = `available`; debit fisik HANYA pada event DISPATCH sah
(aktor berwenang) → `in_transit`; receipt cabang tutup in-transit (+1 cabang). Tanpa dispatch =
tanpa debit (status quo aman). Risiko: saldo pusat terlihat "utuh" padahal terkomitmen —
mitigasi: tampilkan reserved terpisah (sudah ada di UI alokasi).

## R3. Selisih & retur (→ #4)
`selisih` sudah terekam; tambah status `Perlu Review` + peran pereview + event
KOREKSI/RETUR (mutasi bertanda, audit) — tanpa edit historis. Risiko: sengketa + dobel klaim —
mitigasi: idempotency per bukti + referensi silang alokasi↔receipt.

## R4. Pembatalan (→ #5)
Pre-dispatch: status Batal + lepas reservasi (event, ledger abadi). Post-dispatch: retur
terpisah. Tanpa hapus baris. Risiko: cabang pesan ulang ganda — mitigasi: kunci request aktif.

## R5. Approval (→ #6)
Minimal: jumlah-parsial + catatan (sudah didukung alokasi). Reject formal = status +
komentar + notifikasi (butuh backend). Risiko: pengajuan menggantung — mitigasi: SLA review.

## R6. Master & harga (→ #7)
SKU bersama + saldo/min per cabang; perubahan harga versi-berlaku (histori utuh);
nonaktif ≠ hapus. Edit master Owner = peran terpisah (saat ini ditolak).

## R7. PO vs stok (→ #8)
Default aman: tanpa reservasi. Bila diputuskan: potong saat pembayaran PO lunas
(flag per-PO, decrement sekali, idempoten) — bukan saat PO dibuat.

## R8. Akun & cabang (→ #9, #13)
Least privilege; Owner monitoring + alokasi saja; CRUD akun/cabang = modul + RBAC server
tersendiri setelah disahkan.

## R9. Laporan & uang (→ #10, #11, #12)
Sahkan template + definisi omzet (Selesai saja); tanpa refund/DP/laba sampai kebijakan + data.
Ekspor = seluruh baris filter (tertulis di UI).

## R10. Backend (→ #14)
ADR: kontrak `docs/stage-03/DATA_CONTRACT.md` → API; auth server; pilihan stack
menunggu (CI4/MySQL vs React/Supabase — JANGAN migrasi sepihak). Tanpa backend baru tahap ini.
