<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$subtotal = (float) $trx['total'] - (float) $trx['pajak'] - (float) $trx['diskon'];
$metode   = $bayar['metode_pembayaran'] ?? '-';
?>
<div class="success page">
    <div style="display:flex;justify-content:flex-end;padding:6px 6px 0">
        <?= steps(3) ?>
    </div>

    <div class="success-hero">
        <span class="success-badge"><?= icon('check', 38) ?></span>
        <h1>Transaksi Berhasil</h1>
        <p>Pembayaran telah diproses dan pesanan berhasil disimpan.</p>
    </div>

    <div class="two-col">
        <section class="co-card">
            <div class="section-head">
                <h2>Informasi Transaksi</h2>
            </div>
            <div>
                <div class="info-row">
                    <span>No. Transaksi</span>
                    <b><?= esc($trx['kode_transaksi']) ?></b>
                </div>
                <div class="info-row">
                    <span>Tanggal &amp; Jam</span>
                    <b><?= esc(tgl_id($trx['tanggal_transaksi'], true)) ?> WIB</b>
                </div>
                <div class="info-row">
                    <span>Kasir</span>
                    <b><?= esc(session()->get('nama')) ?></b>
                </div>
                <div class="info-row">
                    <span>Nama Pelanggan</span>
                    <b><?= esc($cust['nama_pelanggan'] ?? '-') ?></b>
                </div>
                <div class="info-row">
                    <span>Metode Pembayaran</span>
                    <b><?= esc($metode) ?></b>
                </div>
                <div class="info-row">
                    <span>Total Pembayaran</span>
                    <b><?= rupiah($trx['total']) ?></b>
                </div>
                <div class="info-row">
                    <span>Status</span>
                    <?= status_pill($bayar['status'] ?? 'lunas') ?>
                </div>
            </div>
        </section>

        <section class="co-card">
            <div class="section-head">
                <h2>Produk yang Dibeli</h2>
            </div>
            <div>
                <?php foreach ($detail as $d): ?>
                    <div class="receipt-line">
                        <span class="rl-ico"><?= icon('glasses', 20) ?></span>
                        <span class="rl-body">
                            <b><?= esc($d['nama_barang']) ?></b>
                            <span><?= esc($d['merek']) ?> · <?= esc($d['jenis']) ?> · Qty: <?= (int) $d['jumlah'] ?></span>
                        </span>
                        <span class="tt-money"><?= rupiah($d['subtotal']) ?></span>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="section-head" style="margin-top:6px">
                <h2>Ringkasan Pembayaran</h2>
            </div>
            <div>
                <div class="info-row">
                    <span>Subtotal</span>
                    <b><?= rupiah($subtotal) ?></b>
                </div>
                <div class="info-row">
                    <span>Diskon</span>
                    <b><?= rupiah($trx['diskon']) ?></b>
                </div>
                <div class="info-row">
                    <span>Pajak (PPN 11%)</span>
                    <b><?= rupiah($trx['pajak']) ?></b>
                </div>
                <div class="info-row">
                    <span><b style="color:var(--ink)">Total Pembayaran</b></span>
                    <b><?= rupiah($trx['total']) ?></b>
                </div>
            </div>
        </section>
    </div>

    <div class="action-row">
        <div class="receipt-note">
            <span class="rn-ico"><?= icon('shield-check', 22) ?></span>
            <div>
                <b>Data Tersimpan dengan Aman</b>
                <p>Data transaksi, produk, dan pembayaran telah berhasil disimpan ke sistem. Anda dapat menghubungi pelanggan jika diperlukan.</p>
            </div>
        </div>

        <div class="btn-group">
            <button class="btn btn-ghost" type="button" onclick="window.print()">
                <?= icon('printer', 16) ?>
                Cetak Struk
            </button>
            <a class="btn btn-primary" href="<?= site_url('kasir/transaksi') ?>">Transaksi Baru</a>
            <a class="btn btn-ghost" href="<?= site_url('kasir/riwayat') ?>">
                <?= icon('history', 16) ?>
                Lihat Riwayat
            </a>
        </div>
    </div>
</div>
<?= $this->endSection() ?>
