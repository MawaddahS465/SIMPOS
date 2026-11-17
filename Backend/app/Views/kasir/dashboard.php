<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$menu = [
    ['path' => 'kasir/transaksi', 'ikon' => 'shopping-cart', 'judul' => 'Transaksi Baru'],
    ['path' => 'kasir/pemesanan', 'ikon' => 'clipboard-list', 'judul' => 'Pemesanan (PO)'],
    ['path' => 'kasir/pelanggan', 'ikon' => 'users', 'judul' => 'Pelanggan'],
    ['path' => 'kasir/resep', 'ikon' => 'glasses', 'judul' => 'Resep Mata'],
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

    <section class="dash-metrics" aria-label="Ringkasan hari ini">
        <a class="dash-metric" href="<?= site_url('kasir/riwayat?periode=hari&status=selesai') ?>" aria-label="Lihat transaksi lunas hari ini">
            <span class="dm-icon tone-violet"><?= icon('receipt', 20) ?></span>
            <div>
                <span class="dm-label">Transaksi hari ini</span>
                <b><?= esc((string) $trxHariIni) ?></b>
            </div>
            <svg class="ic dm-arrow" width="17" height="17" aria-hidden="true"><use href="<?= base_url('assets/icons/sprite.svg') ?>#i-arrow-right"></use></svg>
        </a>
        <a class="dash-metric" href="<?= site_url('kasir/riwayat?periode=hari&status=selesai') ?>" aria-label="Lihat transaksi lunas hari ini untuk rincian penerimaan">
            <span class="dm-icon tone-green"><?= icon('wallet', 20) ?></span>
            <div>
                <span class="dm-label">Penerimaan hari ini</span>
                <b><?= esc(rupiah($penerimaanHariIni)) ?></b>
            </div>
            <svg class="ic dm-arrow" width="17" height="17" aria-hidden="true"><use href="<?= base_url('assets/icons/sprite.svg') ?>#i-arrow-right"></use></svg>
        </a>
        <a class="dash-metric" href="<?= site_url('kasir/pemesanan') ?>">
            <span class="dm-icon tone-amber"><?= icon('package-check', 20) ?></span>
            <div>
                <span class="dm-label">PO siap diambil</span>
                <b><?= esc((string) $poSiapDiambil) ?></b>
            </div>
            <svg class="ic dm-arrow" width="17" height="17" aria-hidden="true"><use href="<?= base_url('assets/icons/sprite.svg') ?>#i-arrow-right"></use></svg>
        </a>
    </section>

    <section>
        <div class="section-head">
            <h2>Menu Utama</h2>
        </div>

        <div class="menu-cards">
            <?php foreach ($menu as $m): ?>
                <a href="<?= site_url($m['path']) ?>" class="menu-card">
                    <span class="m-icon"><?= icon($m['ikon'], 24) ?></span>
                    <h3><?= esc($m['judul']) ?></h3>
                    <span class="m-arrow"><?= icon('arrow-right', 18) ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    </section>

    <section class="history-strip">
        <span class="h-icon"><?= icon('history', 24) ?></span>
        <div>
            <h3>Riwayat Transaksi</h3>
        </div>
        <a class="btn btn-ghost" href="<?= site_url('kasir/riwayat') ?>">
            Buka
            <?= icon('arrow-right', 17) ?>
        </a>
    </section>
</div>
<?= $this->endSection() ?>
