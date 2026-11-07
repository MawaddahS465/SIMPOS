# STAGE 03 — Role Permission Matrix (ditegakkan: guard rute + validasi store)

| Aksi | Kasir | Admin Cabang | Catatan |
|---|---|---|---|
| Login sesuai role/cabang | ✅ | ✅ | sesi bersama, redirect per role |
| Lihat katalog + harga + stok cabang | ✅ baca | ✅ baca | satu `products`/`stock` |
| CRUD master frame/lensa | ❌ ditolak (tanpa UI, tanpa API) | ✅ | soft-delete; harga lama di histori utuh |
| Ubah saldo stok langsung | ❌ | ❌ | hanya via event valid |
| Catat penerimaan | ❌ | ✅ cabangnya | idempoten; over-alokasi ditolak |
| Buat pengajuan stok | ❌ | ✅ | tidak menambah stok |
| Tentukan alokasi pusat | ❌ | ❌ (read-only) | otoritas Pemilik |
| Buat PO | ✅ | ❌ | status awal Dipesan |
| PO Dipesan→Diproses→Sudah Datang | ❌ | ✅ | via `transitionPO` + audit |
| PO → Selesai | ⏸️ disabled + tag | ❌ diblokir store | `NEEDS_CLIENT_APPROVAL` |
| Checkout + bayar | ✅ | ❌ guard menolak `/checkout` | `recordSale` di jalur sukses saja |
| Lihat mutasi cabang | ❌ (riwayat jual sendiri) | ✅ read-only | tanpa hapus/ubah |
| Data cabang lain | ❌ | ❌ | `branchId` guard; server: BLOCKED |

Penegakan hari ini = klien/demo (disclosed, bukan keamanan produksi).
