<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$menu = [
    ['path' => 'kasir/transaksi', 'ikon' => 'shopping-cart', 'judul' => 'Transaksi Baru', 'desc' => 'Pilih frame dan lensa untuk pelanggan baru', 'unggulan' => true],
    ['path' => 'kasir/pemesanan', 'ikon' => 'clipboard-list', 'judul' => 'Pemesanan (PO)', 'desc' => 'Kelola pesanan barang yang belum tersedia'],
    ['path' => 'kasir/pelanggan', 'ikon' => 'users', 'judul' => 'Pelanggan', 'desc' => 'Cari, tambah, atau kelola data pelanggan'],
    ['path' => 'kasir/resep', 'ikon' => 'glasses', 'judul' => 'Resep Mata', 'desc' => 'Kelola dan lihat riwayat resep pelanggan'],
];
?>
<div class="dash">
    <section class="hero">
        <div class="hero-copy">
            <span class="overline">SELAMAT DATANG</span>
            <h1><?= esc(session()->get('nama')) ?></h1>
            <p>Siap melayani pelanggan hari ini?</p>
            <a class="btn btn-primary" href="<?= site_url('kasir/transaksi') ?>">
                <?= icon('shopping-cart', 18) ?>
                Mulai Transaksi
            </a>
        </div>
        <div class="hero-media" aria-hidden="true">
            <img src="<?= base_url('assets/hero-approved-right.jpg') ?>" alt="">
        </div>
    </section>

    <section>
        <div class="section-head">
            <h2>Menu Utama</h2>
            <p>Pilih menu untuk memulai aktivitas</p>
        </div>

        <div class="menu-cards">
            <?php foreach ($menu as $m): ?>
                <a href="<?= site_url($m['path']) ?>" class="menu-card <?= ! empty($m['unggulan']) ? 'featured' : '' ?>">
                    <span class="m-icon"><?= icon($m['ikon'], 24) ?></span>
                    <h3><?= esc($m['judul']) ?></h3>
                    <p><?= esc($m['desc']) ?></p>
                    <span class="m-arrow"><?= icon('arrow-right', 18) ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    </section>

    <section class="history-strip">
        <span class="h-icon"><?= icon('history', 24) ?></span>
        <div>
            <h3>Riwayat Transaksi</h3>
            <p>
                <?= $trxHariIni > 0
                    ? esc($trxHariIni . ' transaksi selesai hari ini. Lihat atau cari transaksi sebelumnya.')
                    : 'Lihat transaksi hari ini atau cari transaksi sebelumnya' ?>
            </p>
        </div>
        <a class="btn btn-ghost" href="<?= site_url('kasir/riwayat') ?>">
            Buka
            <?= icon('arrow-right', 17) ?>
        </a>
    </section>
</div>
<?= $this->endSection() ?>
