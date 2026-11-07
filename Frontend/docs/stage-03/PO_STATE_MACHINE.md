# STAGE 03 — PO State Machine

`Baru → Dipesan → Diproses → Sudah Datang → (Selesai ∗)`

- `Buat`: Kasir (`createPO`) → `Dipesan` + timeline + snapshot resep. (INT-07 ✅)
- `Dipesan → Diproses`: Admin (`transitionPO`, catatan opsional). (INT-08 ✅)
- `Diproses → Sudah Datang`: Admin, syarat barang tersedia. (INT-08 ✅)
- `∗ → Selesai`: **NEEDS_CLIENT_APPROVAL** — konflik redaksional PRD (fungsional vs To-Be).
  Tombol Kasir disabled + tag; store menolak `to === "Selesai"`. (INT-18 ✅ ditandai)
- Transisi lain (lompat/mundur/duplikat): ditolak `transitionPO`. (INT-08c/UAT-08 ✅)
- Setiap transisi: `{at, actor, from, to, note}` + audit; Kasir membaca status dari store sama.
