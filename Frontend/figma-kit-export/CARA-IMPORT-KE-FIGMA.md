# Cara Menyambungkan ke Figma

Paket ini hasil capture langsung dari aplikasi yang berjalan di `http://127.0.0.1:5173`.
Isinya: **38 frame desktop (1440×900)** + **11 frame mobile (390×844)**, skala 2× (retina).

```
figma-kit-export/
├─ index.html              ← buka di browser: galeri semua frame + filter role
├─ MANIFEST.csv            ← file;role;judul;route;catatan
├─ MANIFEST.json           ← versi JSON, dipakai index.html & plugin
├─ desktop/  38 PNG
├─ mobile/   11 PNG
├─ figma-plugin/           ← plugin Figma opsional (auto nama + susun per role)
└─ capture.py              ← jalankan ulang kalau tampilan aplikasi berubah
```

---

## Cara 1 — Drag & drop (paling cepat, tanpa tool tambahan)

1. Buka file Figma baru (atau page baru di file yang sudah ada).
2. Buka folder `figma-kit-export/desktop`, select semua PNG (`Ctrl+A`), drag ke canvas Figma.
3. Ulangi untuk folder `mobile` di page terpisah.
4. Figma membuat satu frame per gambar, dan **nama frame otomatis = nama file**, misalnya
   `01 Kasir - Login`, `34 Pemilik - Pengaturan`.
5. Rapikan: select semua → `Shift+A` untuk auto-layout, atau susun manual 3 kolom per baris.

Cara ini 100% jalan tanpa akses API/token. Kekurangannya cuma: susunan masih berantakan
sampai kamu rapikan sendiri.

---

## Cara 2 — Plugin lokal (nama + susunan otomatis)

Plugin kecil di folder `figma-plugin/` membaca semua PNG yang kamu pilih, membuat frame
dengan nama sesuai file, lalu menyusunnya per role (Kasir / Admin Cabang / Pemilik) dengan
judul section di atas tiap grup.

Pasang sekali saja:

1. Buka **Figma Desktop** (bukan browser) → menu **Plugins → Development → Import plugin from manifest…**
2. Pilih `figma-kit-export/figma-plugin/manifest.json`.
3. Jalankan: **Plugins → Development → SIMPOS Optik Mekar Jaya — Import Frame**.
4. Klik area upload → pilih semua PNG dari `desktop/` → **Buat frame di Figma**.
5. Ulangi di page lain untuk folder `mobile/`.

Plugin ini tidak butuh koneksi internet dan tidak minta token Figma — semua diproses lokal.

---

## Cara 3 — html.to.design (kalau butuh layer yang bisa diedit)

Kalau yang kamu butuhkan bukan gambar, tapi **layer asli Figma** (auto-layout, teks editable,
komponen), pakai plugin pihak ketiga `html.to.design`:

1. Install plugin dari Figma Community.
2. Jalankan plugin, tempel URL aplikasi yang sedang jalan:
   - `http://127.0.0.1:5173/login`
   - `http://127.0.0.1:5173/dashboard` (perlu sesi login dulu di tab yang sama)
   - dan seterusnya
3. Plugin membangun ulang halaman jadi layer Figma.

Catatan jujur: plugin ini punya batas kuota di paket gratis, hasil konversinya biasanya tetap
perlu dirapikan (auto-layout dan efek bayangan sering meleset), dan halaman yang butuh login
kadang tidak bisa diakses plugin. Jadi untuk dokumentasi/handoff, Cara 1 atau 2 lebih andal.

---

## Yang perlu dipahami soal "tersambung"

| Yang kamu mau | Bisa? | Caranya |
|---|---|---|
| Tampilan app masuk ke Figma sebagai frame | Ya | Cara 1 / 2 (paket ini) |
| Desain di Figma berubah → app ikut berubah | Tidak otomatis | Harus edit kode manual, atau pakai Figma Dev Mode MCP (butuh Figma Desktop + seat Dev berbayar) |
| Sinkron dua arah realtime | Tidak | Tidak ada jalur resmi tanpa API/token + backend |
| Token warna & font sama antara Figma dan kode | Ya | Ekspor `src/styles/tokens.css` → plugin Tokens Studio |

Figma REST API butuh **personal access token** dan **file key** milik akunmu. Selama belum ada
dua hal itu, semua integrasi bersifat satu arah (app → file desain), dan itu yang dipakai paket ini.

---

## Kalau tampilan aplikasi berubah

Jalankan ulang capture (butuh dev server hidup di `127.0.0.1:5173`):

```powershell
# dari folder simpos-optik
powershell -ExecutionPolicy Bypass -File .\demo-tunnel.ps1   # kalau server belum jalan
python .\figma-kit-export\capture.py
```

Script akan menimpa PNG dan menulis ulang `MANIFEST.csv` / `MANIFEST.json`.
Setelah itu buka `index.html` untuk cek hasilnya sebelum di-import ke Figma.

> Perbarui `index.html` juga: `capture.py` hanya menulis manifest, bukan galeri.
> Jalankan `python .\figma-kit-export\build_index.py` untuk regenerate galeri.
