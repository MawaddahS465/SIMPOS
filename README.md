# SIMPOS – Sistem Informasi Manajemen Optik

## Deskripsi Aplikasi

SIMPOS (Sistem Informasi Manajemen Optik) merupakan aplikasi berbasis web yang dikembangkan untuk membantu pengelolaan operasional toko optik. Aplikasi ini dirancang untuk mempermudah pengelolaan data barang, stok cabang, pelanggan, transaksi penjualan, pembayaran, resep kacamata, serta pemesanan barang.

Aplikasi ini memiliki beberapa hak akses pengguna, yaitu **Pemilik, Admin, dan Kasir**, dengan fitur yang disesuaikan berdasarkan peran masing-masing pengguna.

## Teknologi yang Digunakan

### Backend
- PHP
- CodeIgniter 4
- MySQL
- Composer

### Frontend
- React
- TypeScript
- Node.js
- NPM

## Struktur Repository

```text
SIMPOS/
│
├── Backend/       # Source code backend dan REST API
│
├── Frontend/      # Source code frontend
│
├── .gitignore     # File konfigurasi Git
│
└── README.md      # Dokumentasi project
```

## Persyaratan Sistem

Pastikan perangkat sudah memiliki:
- PHP dan ekstensi yang dibutuhkan CodeIgniter 4.
- Composer.
- MySQL atau XAMPP.
- Node.js dan NPM.
- Git.

## Cara Menjalankan Backend

1. Buka terminal atau Git Bash.
2. Masuk ke folder Backend:

```bash
cd Backend
```

3. Instal dependensi:

```bash
composer install
```

4. Salin file `env` menjadi `.env` jika file `.env` belum tersedia.

5. Buka file `.env`, kemudian sesuaikan konfigurasi database:

```ini
CI_ENVIRONMENT = development

database.default.hostname = localhost
database.default.database = SIMPOS
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi
database.default.port = 3306
```

Sesuaikan nama database, username, password, dan port dengan konfigurasi MySQL yang digunakan.

6. Import file database `dbsimpos.sql` ke MySQL melalui phpMyAdmin atau aplikasi database lainnya.

7. Jalankan server backend:

```bash
php spark serve
```

Backend secara default dapat diakses melalui:

```text
http://localhost:8080
```

## Cara Menjalankan Frontend

1. Buka terminal baru.
2. Masuk ke folder Frontend dari direktori utama SIMPOS:

```bash
cd Frontend
```

3. Instal dependensi:

```bash
npm install
```

4. Sesuaikan konfigurasi alamat API backend pada file environment frontend jika diperlukan. Gunakan format konfigurasi yang tersedia pada `.env.example`.

5. Jalankan frontend:

```bash
npm run dev
```

6. Buka alamat lokal yang ditampilkan pada terminal, biasanya:

```text
http://localhost:5173
```

Pastikan backend sudah berjalan agar frontend dapat terhubung dengan API.

## Konfigurasi Database

Aplikasi SIMPOS menggunakan MySQL sebagai sistem manajemen basis data.

Informasi database:
- Nama database: `SIMPOS`
- DBMS: MySQL
- File database: `Backend/dbsimpos.sql`

Untuk menggunakan database, import file SQL tersebut melalui phpMyAdmin atau MySQL, kemudian sesuaikan konfigurasi koneksi database pada file `.env` di folder Backend.

## Akun Login Pengujian

Akun login pengujian mengikuti data pengguna yang tersedia pada database SIMPOS.

Belum ada informasi username dan password akun pengujian yang dicantumkan dalam dokumentasi ini. Gunakan akun yang telah disediakan pada database atau oleh pengembang.

## Repository

GitHub: https://github.com/MawaddahS465/SIMPOS.git
