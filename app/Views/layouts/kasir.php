<?php
$nama  = (string) (session()->get('nama') ?? 'Kasir');
$uri   = uri_string();
$navUtama = [
    ['kunci' => 'dashboard', 'label' => 'Dashboard', 'path' => 'kasir/dashboard', 'ikon' => 'layout-grid'],
    ['kunci' => 'transaksi', 'label' => 'Transaksi Baru', 'path' => 'kasir/transaksi', 'ikon' => 'shopping-cart'],
    ['kunci' => 'pemesanan', 'label' => 'Pemesanan (PO)', 'path' => 'kasir/pemesanan', 'ikon' => 'clipboard-list'],
    ['kunci' => 'riwayat', 'label' => 'Riwayat Transaksi', 'path' => 'kasir/riwayat', 'ikon' => 'history'],
];
$navLain = [
    ['kunci' => 'pelanggan', 'label' => 'Pelanggan', 'path' => 'kasir/pelanggan', 'ikon' => 'users'],
    ['kunci' => 'resep', 'label' => 'Resep Mata', 'path' => 'kasir/resep', 'ikon' => 'glasses'],
];
$aktif = $aktif ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= esc($judul ?? 'Kasir') ?> - SIMPOS Optik Mekar Jaya</title>

    <link rel="icon" type="image/svg+xml" href="<?= base_url('favicon.svg') ?>">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= base_url('favicon-32.png') ?>">
    <meta name="theme-color" content="#5b55fb">

    <link href="<?= base_url('assets/css/design/tokens.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/global.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/components.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/layout.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/pages.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/dashboard.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/admin.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/kasir.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/overrides.css') ?>" rel="stylesheet">
</head>

<body class="page-bg app-shell">
    <div class="scrim" id="scrim"></div>

    <div class="app-grid">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-brand">
                <img src="<?= base_url('assets/logo-mk.png') ?>" width="44" height="44" alt="Logo Optik Mekar Jaya">
                <span class="brand-text">
                    <b>Optik Mekar Jaya</b>
                    <span>Sistem Informasi Optik</span>
                </span>
            </div>

            <nav class="sidebar-nav">
                <?php foreach ($navUtama as $item): ?>
                    <a class="nav-item <?= $aktif === $item['kunci'] ? 'active' : '' ?>" href="<?= site_url($item['path']) ?>">
                        <?= icon($item['ikon'], 19) ?>
                        <?= esc($item['label']) ?>
                    </a>
                <?php endforeach; ?>

                <div class="nav-sep"></div>

                <?php foreach ($navLain as $item): ?>
                    <a class="nav-item <?= $aktif === $item['kunci'] ? 'active' : '' ?>" href="<?= site_url($item['path']) ?>">
                        <?= icon($item['ikon'], 19) ?>
                        <?= esc($item['label']) ?>
                    </a>
                <?php endforeach; ?>
            </nav>

            <div class="sidebar-foot">
                <b><?= esc(current_branch_name()) ?></b>
                <span><?= esc(current_role_label()) ?></span>
                <form class="inline-form" method="post" action="<?= site_url('logout') ?>">
                    <?= csrf_field() ?>
                    <button type="submit" class="link-action admin-logout">
                        <?= icon('log-out', 14) ?>
                        Keluar
                    </button>
                </form>
            </div>
        </aside>

        <main class="mainpanel">
            <header class="topbar">
                <button class="burger" type="button" aria-label="Buka menu" id="burger">
                    <?= icon('menu', 20) ?>
                </button>

                <?php if ($aktif === 'dashboard'): ?>
                    <form class="search-field" method="get" action="<?= site_url('kasir/transaksi') ?>" role="search">
                        <?= icon('search', 18) ?>
                        <input type="search" name="q" value="<?= esc($cariQ ?? '') ?>" placeholder="Cari produk, pelanggan, atau transaksi..." aria-label="Pencarian">
                        <span class="kbd">Enter</span>
                    </form>
                <?php endif; ?>

                <div class="topbar-right">
                    <button class="icon-pill" type="button" aria-label="Notifikasi">
                        <?= icon('bell', 19) ?>
                        <span class="dot"></span>
                    </button>
                    <div class="profile">
                        <span class="avatar"><?= esc(initials($nama)) ?></span>
                        <span class="profile-text">
                            <b><?= esc($nama) ?></b>
                            <span><?= esc(current_role_label()) ?></span>
                        </span>
                    </div>
                </div>
            </header>

            <div class="main-content">
                <?php if (session()->getFlashdata('error')): ?>
                    <div class="notice">
                        <?= icon('triangle-alert', 16) ?>
                        <?= esc(session()->getFlashdata('error')) ?>
                    </div>
                <?php endif; ?>

                <?php if (session()->getFlashdata('success')): ?>
                    <div class="notice notice-ok" role="status">
                        <?= icon('check', 16) ?>
                        <?= esc(session()->getFlashdata('success')) ?>
                    </div>
                <?php endif; ?>

                <?= $this->renderSection('content') ?>
            </div>
        </main>
    </div>

    <script>
        (function () {
            var sidebar = document.getElementById('sidebar');
            var scrim = document.getElementById('scrim');
            var burger = document.getElementById('burger');

            function tutup() {
                sidebar.classList.remove('open');
                scrim.classList.remove('show');
            }

            burger.addEventListener('click', function () {
                sidebar.classList.add('open');
                scrim.classList.add('show');
            });

            scrim.addEventListener('click', tutup);
        })();
    </script>
</body>
</html>
