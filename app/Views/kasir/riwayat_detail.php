<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$metode    = (string) ($trx['metode_pembayaran'] ?? 'Tunai');
$metode    = $metode !== '' ? $metode : 'Tunai';
$waktu     = strtotime((string) ($trx['tanggal_transaksi'] ?? ''));
$jam       = $waktu !== false ? date('H:i', $waktu) : '-';
$subtotal  = (float) ($trx['total'] ?? 0) + (float) ($trx['diskon'] ?? 0);
$dibayar   = $metode === 'Tunai'
    ? (float) ($trx['jumlah_bayar'] ?? $trx['total'] ?? 0)
    : (float) ($trx['total'] ?? 0);
$kembalian = $metode === 'Tunai' ? max(0, $dibayar - (float) ($trx['total'] ?? 0)) : 0.0;
$metodeIkonMap = [
    'Tunai'              => 'banknote',
    'QRIS'               => 'qr-code',
    'Transfer Bank'      => 'wallet',
    'Kartu Debit/Kredit' => 'credit-card',
    'E-Wallet'           => 'wallet',
];
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs">
            <a href="<?= site_url('kasir/riwayat') ?>">Riwayat Transaksi</a> ›
            <b>Detail Transaksi</b>
        </div>
        <div class="pagehead-main">
            <div>
                <div class="overline">DETAIL TRANSAKSI</div>
                <h1><?= esc($trx['kode_transaksi'] ?? 'Transaksi') ?></h1>
                <p>Informasi pelanggan, produk, dan pembayaran transaksi.</p>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-ghost" href="<?= site_url('kasir/riwayat') ?>">
                    <?= icon('arrow-left', 16) ?>
                    Kembali ke Riwayat
                </a>
                <button class="btn btn-primary" type="button" onclick="window.print()">
                    <?= icon('printer', 16) ?>
                    Cetak Struk
                </button>
            </div>
        </div>
    </div>

    <div class="checkout-left">
        <section class="co-card">
            <div class="section-head">
                <h2>Informasi Transaksi</h2>
            </div>
            <div>
                <div class="info-row">
                    <span>Pelanggan</span>
                    <b><?= esc($trx['nama_pelanggan'] ?? '-') ?></b>
                </div>
                <div class="info-row">
                    <span>Nomor HP</span>
                    <b><?= esc($trx['no_hp'] ?? '-') ?></b>
                </div>
                <div class="info-row">
                    <span>Tanggal &amp; Jam</span>
                    <b><?= esc(tgl_id($trx['tanggal_transaksi'] ?? null)) ?> · <?= esc($jam) ?> WIB</b>
                </div>
                <div class="info-row">
                    <span>Metode Pembayaran</span>
                    <b style="display:inline-flex;align-items:center;gap:6px">
                        <?= icon($metodeIkonMap[$metode] ?? 'wallet', 14) ?>
                        <?= esc($metode) ?>
                    </b>
                </div>
                <div class="info-row">
                    <span>Status Transaksi</span>
                    <?= status_pill($trx['status'] ?? '') ?>
                </div>
            </div>

            <?php if (($trx['jenis'] ?? '') === 'pemesanan'): ?>
                <div class="section-head" style="margin-top:18px">
                    <h2>Resep Mata</h2>
                </div>
                <?php if ($resep !== null): ?>
                    <div class="rx-mini">
                        <div class="rx-eye">
                            <div class="ey-label">OD / KANAN</div>
                            <b><?= esc($resep['od_sph'] ?? '-') ?></b>
                            <span>CYL <?= esc($resep['od_cyl'] ?? '0.00') ?> · AXIS <?= esc($resep['od_axis'] ?? '-') ?></span>
                        </div>
                        <div class="rx-eye">
                            <div class="ey-label">OS / KIRI</div>
                            <b><?= esc($resep['os_sph'] ?? '-') ?></b>
                            <span>CYL <?= esc($resep['os_cyl'] ?? '0.00') ?> · AXIS <?= esc($resep['os_axis'] ?? '-') ?></span>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="empty-note">Arsip resep pelanggan ini tidak ditemukan.</div>
                <?php endif; ?>
            <?php endif; ?>
        </section>

        <section class="co-card">
            <div class="section-head">
                <h2>Produk yang Dibeli</h2>
            </div>
            <div>
                <?php foreach ($detail as $item): ?>
                    <div class="receipt-line">
                        <span class="rl-ico"><?= icon('glasses', 20) ?></span>
                        <span class="rl-body">
                            <b><?= esc($item['nama_barang'] ?? '-') ?></b>
                            <span><?= esc($item['merek'] ?? '-') ?> · <?= esc($item['jenis'] ?? '-') ?> · <?= (int) ($item['jumlah'] ?? 0) ?> × <?= esc(rupiah($item['harga'] ?? 0)) ?></span>
                        </span>
                        <span class="tt-money"><?= esc(rupiah($item['subtotal'] ?? 0)) ?></span>
                    </div>
                <?php endforeach; ?>
                <?php if ($detail === []): ?>
                    <div class="empty-note">Tidak ada rincian produk.</div>
                <?php endif; ?>
            </div>

            <div class="section-head" style="margin-top:18px">
                <h2>Ringkasan Pembayaran</h2>
            </div>
            <div>
                <div class="info-row">
                    <span>Subtotal</span>
                    <b><?= esc(rupiah($subtotal)) ?></b>
                </div>
                <div class="info-row">
                    <span>Diskon</span>
                    <b><?= esc(rupiah($trx['diskon'] ?? 0)) ?></b>
                </div>
                <div class="info-row">
                    <span>Total Tagihan</span>
                    <b><?= esc(rupiah($trx['total'] ?? 0)) ?></b>
                </div>
                <?php if ($metode === 'Tunai'): ?>
                    <div class="info-row">
                        <span>Jumlah Dibayar</span>
                        <b><?= esc(rupiah($dibayar)) ?></b>
                    </div>
                    <div class="info-row">
                        <span>Kembalian</span>
                        <b><?= esc(rupiah($kembalian)) ?></b>
                    </div>
                <?php endif; ?>
            </div>
        </section>
    </div>
    <?= $this->include('kasir/_struk_transaksi') ?>
</div>
<?= $this->endSection() ?>
