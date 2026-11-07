# ADR-DRAFT-001 — Backend Stack (status: PROPOSED, bukan keputusan)

- Konteks: Charter (CI4/MySQL) vs Bab II (React/Supabase) vs realita repo (React SPA, tanpa backend).
- Opsi: (a) Supabase, (b) CI4/MySQL VPS, (c) tetap prototype (non-produksi).
- Keputusan: **DITUNDA** — menunggu pengesahan 14 item + pilihan stakeholder (#14).
- Konsekuensi penundaan: RBAC server, konkurensi, backup tetap BLOCKED; demo tetap lokal.
- Kriteria pemilihan kelak: biaya, kemampuan tim, RPO/RTO, RLS/cabang, audit-Opsi.

# ADR-DRAFT-002 — Debit Stok Pusat (status: PROPOSED)

- Konteks: item #2/#3 (reservasi saat alokasi vs debit saat dispatch vs terima).
- Usulan: reservasi non-fisik saat alokasi; debit `on_hand` + `in_transit` saat DISPATCH sah.
- Keputusan: **DITUNDA** — menunggu #2 dan #3 disahkan.
