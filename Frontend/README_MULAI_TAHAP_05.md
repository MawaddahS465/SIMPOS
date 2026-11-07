# README — Tahap 05 SIMPOS Optik Mekar Jaya

## Apa yang dilakukan
Tahap 05 bukan coding fitur baru. Ia menelaah 14 keputusan bisnis dari repository pengguna dan menghasilkan dokumen review/approval serta rencana dampak perubahan. Desain dan seluruh source Checkpoint 0–4 tetap dikunci. Tanpa persetujuan stakeholder, seluruh rekomendasi tetap PENDING.

## Cara menjalankan
1. Backup/simpan keadaan project terlebih dahulu (`git status`, commit/branch checkpoint bila prosedur project mengizinkan).
2. Salin `MASTER_PROMPT_OPENCODE_TAHAP_05.md` ke **root repository SIMPOS yang sama**.
3. Jalankan `opencode` dari root repository.
4. Salin instruksi pendek berikut:

> Baca `MASTER_PROMPT_OPENCODE_TAHAP_05.md` lalu jalankan Tahap 05 sampai paket dokumen review keputusan siap. Mulai dari membaca `docs/final/OPEN_BUSINESS_DECISIONS.md` untuk mengambil **14 entri persis**, jangan menebak daftar dari chat. Kunci seluruh source dan desain Checkpoint 0–4, jangan ubah business logic, sharedStore, database atau fitur apa pun. Buat `docs/stage-05/` sesuai deliverables, jalankan baseline tests tanpa memodifikasi source, dan berhenti untuk review. Jangan menyetujui kebijakan atas nama stakeholder dan jangan masuk Tahap 06.

## Penting
Ringkasan laporan terdahulu hanya menyebut 13 topik spesifik dari '14 keputusan', sehingga entri ke-14 harus diperoleh dari dokumen repository asli. PRD tidak otomatis menetapkan kapan debit pusat dilakukan, siapa yang memfinalkan PO, atau aturan refund/DP.

## Hasil yang harus dibagikan kembali
- `docs/stage-05/01_DECISION_REGISTER.md`
- `docs/stage-05/02_STAKEHOLDER_QUESTIONNAIRE.md`
- `docs/stage-05/04_APPROVAL_SHEET.md`
- hasil baseline tests yang benar-benar dijalankan

Setelah keputusan disahkan oleh stakeholder, baru boleh diterjemahkan menjadi backlog implementasi Tahap 06.
