# 08 — Provisional Decision Summary (pilihan sementara tim, BUKAN kebijakan sah)

Status resmi semua item: `PENDING_STAKEHOLDER`. Kolom `stakeholder_decision` kosong sampai
`04_APPROVAL_SHEET.md` ditandatangani. `implementation_gate`: CLOSED untuk semua (dilarang
implementasi sebelum pengesahan).

| # | proposed_option | Pertimbangan | unresolved_details | decision_owner | evidence_reference |
|---|---|---|---|---|---|
| 1 | A — Kasir finalkan Selesai pasca bayar + serah terima | Satu aktor jelas di titik serah terima fisik | Kriteria "serah terima" + bukti (nota/TTD?) | Pemilik usaha | — (pending) |
| 2 | B — Reservasi saat alokasi, debit fisik saat dispatch | Saldo jujur + komitmen terlihat | Siapa sahkan dispatch; dokumen serah terima | Pemilik usaha | — |
| 3 | A — Status Dalam Pengiriman | Rantai utuh alokasi→kirim→terima | Peran pencatat kirim; SLA kirim | Pemilik usaha | — |
| 4 | A — Aktual + selisih + review + koreksi/retur terpisah | Tanpa normalisasi diam-diam | Peran pereview; batas toleransi; retur ke siapa | Pemilik usaha | — |
| 5 | A — Batal pre-kirim (lepas reservasi); post-kirim via retur | Ledger abadi | Batas waktu batal; denda/biaya? | Pemilik usaha | — |
| 6 | A — Jumlah parsial + catatan; tanpa Tolak khusus | Alokasi parsial sudah didukung store | SLA review; notifikasi nyata (butuh backend) | Pemilik usaha | — |
| 7 | A — SKU bersama, stok/min per cabang; harga+edit terbuka | Histori harga utuh | Aturan harga antar-cabang; siapa edit master | Pemilik usaha | — |
| 8 | A — PO tak debit stok; reservasi/waktu debit terbuka | Aman default | Flag reserve_on_payment; titik debit final | Pemilik usaha | — |
| 9 | B — Bukittinggi nonaktif | Tanpa data fiktif | Kriteria kesiapan + jadwal aktivasi | Pemilik usaha | — |
| 10 | A — Template QA + ekspor seluruh baris | Konsisten tampilan↔file | Pemeriksaan file aktual oleh stakeholder | Pemilik usaha | — |
| 11 | A — Tanpa alur finansial baru | Tanpa asumsi kas | Validasi kebutuhan operasional nyata | Pemilik + keuangan | — |
| 12 | A — Tanpa laporan laba | Tanpa data biaya | Rumus HPP bila kelak diputuskan | Pemilik usaha | — |
| 13 | A — Tanpa CRUD akun/cabang; provisioning terbuka | Least privilege | Petugas provisioning produksi | Pemilik usaha | — |
| 14 | A — ADR + skema + API + auth + migrasi (rencana saja) | Tanpa lock-in sepihak | Pilihan stack; estimasi; RPO/RTO | Pemilik + tim IT | `10_*`, `11_*` |

`decision_date`: — (belum ada). `stakeholder_decision`: — (semua kosong).
