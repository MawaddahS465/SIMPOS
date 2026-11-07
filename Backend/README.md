# SIMPOS Optik Mekar Jaya

## Panduan Struktur SIMPOS Optik Mekar Jaya

Folder aplikasi di `app/` sudah dikelompokkan mengikuti pola CodeIgniter 4. Saat
mengembangkan fitur, letakkan setiap jenis file di folder yang sesuai:

| Lokasi | Isi |
| --- | --- |
| `app/Controllers/` | Alur permintaan dan penghubung antara model dengan tampilan |
| `app/Models/` | Akses dan aturan data database |
| `app/Views/` | Tampilan halaman, dikelompokkan per fitur seperti `auth/` dan `dashboard/` |
| `app/Config/` | Pengaturan aplikasi, route, database, session, dan keamanan |
| `app/Filters/` | Pemeriksaan sebelum atau sesudah request, seperti autentikasi |
| `app/Database/Migrations/` | Perubahan struktur tabel database |
| `app/Database/Seeds/` | Data awal atau data contoh untuk database |
| `public/` | File yang boleh diakses langsung oleh browser dan entry point aplikasi |
| `writable/` | File runtime seperti log, cache, session, dan upload |
| `system/` | Kode inti CodeIgniter; jangan letakkan kode fitur SIMPOS di sini |
| `tests/` | Pengujian otomatis |

Contoh mengikuti alur login: route di `app/Config/Routes.php` menerima request,
`app/Controllers/Auth.php` memproses login, `app/Models/UserModel.php`
mengakses pengguna, lalu `app/Views/auth/login.php` menampilkan form.

Untuk fitur baru, kelompokkan tampilan di subfolder berdasarkan nama fitur,
misalnya `app/Views/barang/`, dan gunakan nama file yang menjelaskan fungsinya.
Jangan memindahkan file konfigurasi inti CodeIgniter atau mengubah nama folder
standar tanpa memperbarui konfigurasi dan memeriksa dampaknya.

## Cara Menjalankan

Prasyarat: PHP 8.2+ (XAMPP), MySQL/MariaDB, ekstensi `intl` dan `mbstring`.

1. Nyalakan **MySQL** dari XAMPP Control Panel.
2. Buka terminal di folder proyek, lalu jalankan:

   ```powershell
   php spark serve --port 8080
   ```

   Di VS Code cukup tekan `Ctrl + Shift + B` (task "SIMPOS: Jalankan server").
3. Buka <http://localhost:8080>.
4. Login dengan akun contoh: `pemilik` / `123`, `admin1` / `123`, `kasir1` / `123`.

Backend menyediakan API autentikasi session di `POST /api/login`, `GET /api/me`,
dan `POST /api/logout`. Request dari frontend Vite `http://127.0.0.1:5173`
menggunakan `credentials: 'include'` dan header `X-CSRF-TOKEN`. Ambil token awal
dari `GET /api/me` (respons 200 maupun 401 selalu menyertakan `csrfToken`), lalu
perbarui token dari setiap respons JSON karena token dirotasi setelah request
POST yang valid. Cookie session memakai `SameSite=None; Secure`; pada
development, request loopback ditandai secure agar cookie tetap terkirim di
`http://localhost:8080`.

Catatan: `php spark serve` berjalan satu proses, sehingga Chrome kadang menutup
koneksi preflight/POST pertama (`ERR_EMPTY_RESPONSE`). Ulangi request atau
gunakan Apache saat menguji integrasi frontend.

Database awal bisa dibuat dengan
`php spark migrate` lalu `php spark db:seed CabangSeeder` dan `php spark db:seed UserSeeder`
(atau import `dbsimpos.sql` lewat phpMyAdmin).

## What is CodeIgniter?

CodeIgniter is a PHP full-stack web framework that is light, fast, flexible and secure.
More information can be found at the [official site](https://codeigniter.com).

This repository holds the distributable version of the framework.
It has been built from the
[development repository](https://github.com/codeigniter4/CodeIgniter4).

More information about the plans for version 4 can be found in [CodeIgniter 4](https://forum.codeigniter.com/forumdisplay.php?fid=28) on the forums.

You can read the [user guide](https://codeigniter.com/user_guide/)
corresponding to the latest version of the framework.

## Important Change with index.php

`index.php` is no longer in the root of the project! It has been moved inside the *public* folder,
for better security and separation of components.

This means that you should configure your web server to "point" to your project's *public* folder, and
not to the project root. A better practice would be to configure a virtual host to point there. A poor practice would be to point your web server to the project root and expect to enter *public/...*, as the rest of your logic and the
framework are exposed.

**Please** read the user guide for a better explanation of how CI4 works!

## Repository Management

We use GitHub issues, in our main repository, to track **BUGS** and to track approved **DEVELOPMENT** work packages.
We use our [forum](http://forum.codeigniter.com) to provide SUPPORT and to discuss
FEATURE REQUESTS.

This repository is a "distribution" one, built by our release preparation script.
Problems with it can be raised on our forum, or as issues in the main repository.

## Contributing

We welcome contributions from the community.

Please read the [*Contributing to CodeIgniter*](https://github.com/codeigniter4/CodeIgniter4/blob/develop/CONTRIBUTING.md) section in the development repository.

## Server Requirements

PHP version 8.2 or higher is required, with the following extensions installed:

- [intl](http://php.net/manual/en/intl.requirements.php)
- [mbstring](http://php.net/manual/en/mbstring.installation.php)

> [!WARNING]
> - The end of life date for PHP 7.4 was November 28, 2022.
> - The end of life date for PHP 8.0 was November 26, 2023.
> - The end of life date for PHP 8.1 was December 31, 2025.
> - If you are still using below PHP 8.2, you should upgrade immediately.
> - The end of life date for PHP 8.2 will be December 31, 2026.

Additionally, make sure that the following extensions are enabled in your PHP:

- json (enabled by default - don't turn it off)
- [mysqlnd](http://php.net/manual/en/mysqlnd.install.php) if you plan to use MySQL
- [libcurl](http://php.net/manual/en/curl.requirements.php) if you plan to use the HTTP\CURLRequest library
