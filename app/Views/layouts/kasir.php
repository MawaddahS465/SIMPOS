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
                        <input type="search" name="q" value="<?= esc($cariQ ?? '') ?>" placeholder="Cari nama produk, merek, atau kode barang..." aria-label="Cari produk">
                        <span class="kbd">Enter</span>
                    </form>
                <?php endif; ?>

                <div class="topbar-right">
                    <div class="notif-wrap" id="kasir-notif-wrap">
                        <button class="icon-pill notif-btn" id="kasir-notif-button" type="button" aria-label="Buka notifikasi" aria-expanded="false" aria-controls="kasir-notif-panel" title="Notifikasi">
                            <?= icon('bell', 19) ?>
                            <span class="dot" id="kasir-notif-dot" hidden></span>
                        </button>
                        <section class="notif-panel" id="kasir-notif-panel" aria-label="Notifikasi PO" hidden>
                            <div class="notif-head">
                                <div>
                                    <b>Notifikasi</b>
                                    <span class="notif-sub" id="kasir-notif-count">PO siap diambil pelanggan</span>
                                </div>
                            </div>
                            <ul class="notif-list" id="kasir-notif-list" aria-live="polite">
                                <li class="notif-empty">Memuat notifikasi...</li>
                            </ul>
                            <div style="padding:0 12px 12px">
                                <a class="notif-readall" href="<?= site_url('kasir/pemesanan?status=sudah_datang') ?>">Lihat semua PO siap diambil</a>
                            </div>
                        </section>
                    </div>
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
            var notifWrap = document.getElementById('kasir-notif-wrap');
            var notifButton = document.getElementById('kasir-notif-button');
            var notifPanel = document.getElementById('kasir-notif-panel');
            var notifList = document.getElementById('kasir-notif-list');
            var notifCount = document.getElementById('kasir-notif-count');
            var notifDot = document.getElementById('kasir-notif-dot');
            var notifLoaded = false;

            function tutup() {
                sidebar.classList.remove('open');
                scrim.classList.remove('show');
            }

            burger.addEventListener('click', function () {
                sidebar.classList.add('open');
                scrim.classList.add('show');
            });

            scrim.addEventListener('click', tutup);

            function renderNotifications(data) {
                notifList.replaceChildren();
                notifCount.textContent = data.total + ' PO siap diambil';
                notifDot.hidden = data.total < 1;

                if (data.items.length === 0) {
                    var empty = document.createElement('li');
                    empty.className = 'notif-empty';
                    empty.textContent = 'Belum ada PO yang siap diambil.';
                    notifList.appendChild(empty);
                    return;
                }

                data.items.forEach(function (item) {
                    var row = document.createElement('li');
                    var link = document.createElement('a');
                    var iconBox = document.createElement('span');
                    var textBox = document.createElement('span');
                    var title = document.createElement('b');
                    var description = document.createElement('span');
                    var dot = document.createElement('span');

                    link.className = 'notif-item';
                    link.href = item.url;
                    iconBox.className = 'notif-ic tone-ok';
                    iconBox.textContent = 'PO';
                    textBox.className = 'notif-text';
                    title.textContent = item.kode;
                    description.textContent = item.pelanggan + ' · ' + item.tanggal;
                    dot.className = 'notif-new';

                    textBox.append(title, description);
                    link.append(iconBox, textBox, dot);
                    row.appendChild(link);
                    notifList.appendChild(row);
                });
            }

            async function muatNotifikasi() {
                notifList.replaceChildren();
                var loading = document.createElement('li');
                loading.className = 'notif-empty';
                loading.textContent = 'Memuat notifikasi...';
                notifList.appendChild(loading);

                try {
                    var response = await fetch('<?= site_url('kasir/notifikasi') ?>', {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin'
                    });

                    if (! response.ok) {
                        throw new Error('Notifikasi gagal dimuat (' + response.status + ').');
                    }

                    var data = await response.json();

                    if (! Array.isArray(data.items) || typeof data.total !== 'number') {
                        throw new Error('Data notifikasi tidak valid.');
                    }

                    renderNotifications(data);
                    notifLoaded = true;
                } catch (error) {
                    notifList.replaceChildren();
                    var failure = document.createElement('li');
                    failure.className = 'notif-empty';
                    failure.textContent = error.message || 'Notifikasi gagal dimuat. Coba lagi.';
                    notifList.appendChild(failure);
                }
            }

            notifButton.addEventListener('click', function () {
                var open = notifButton.getAttribute('aria-expanded') === 'true';
                notifButton.setAttribute('aria-expanded', open ? 'false' : 'true');
                notifButton.classList.toggle('is-open', ! open);
                notifPanel.hidden = open;

                if (! open && ! notifLoaded) {
                    muatNotifikasi();
                }
            });

            document.addEventListener('click', function (event) {
                if (! notifWrap.contains(event.target)) {
                    notifPanel.hidden = true;
                    notifButton.setAttribute('aria-expanded', 'false');
                    notifButton.classList.remove('is-open');
                }
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    notifPanel.hidden = true;
                    notifButton.setAttribute('aria-expanded', 'false');
                    notifButton.classList.remove('is-open');
                }
            });
        })();
    </script>
</body>
</html>
