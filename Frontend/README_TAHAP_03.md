# Cara menjalankan Tahap 03 di OpenCode

1. Cadangkan atau commit project SIMPOS yang sudah berjalan. Jangan overwrite kode Kasir.
2. Salin `MASTER_PROMPT_OPENCODE_INTEGRASI_KASIR_ADMIN.md` ke **root repository SIMPOS yang sama**.
3. Buka terminal di root repository dan jalankan `opencode`.
4. Kirim instruksi:

   `Baca seluruh file MASTER_PROMPT_OPENCODE_INTEGRASI_KASIR_ADMIN.md dan kerjakan sesuai tahapan. Audit keadaan aktual repository lebih dulu. Jangan mengubah design system Kasir atau mengklaim integrasi penuh jika aplikasi masih menggunakan localStorage.`

5. Setelah dijalankan, minta hasil `docs/stage-03/INTEGRATION_AUDIT.md`, `qa/stage-03/CROSS_ROLE_TEST_MATRIX.md` dan screenshot browser aktual.

PENTING: Status implementasi Admin Tahap 01/02 dan tipe backend belum diverifikasi dari kode sumber. Prompt secara eksplisit memerintahkan audit; apabila belum tersedia, harus dilaporkan terlebih dahulu.
