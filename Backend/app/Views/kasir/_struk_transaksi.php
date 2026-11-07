<?php
$jumlahItem = 0;
$subtotalItem = 0.0;

foreach ($detail as $item) {
    $jumlahItem += (int) ($item['jumlah'] ?? 0);
    $subtotalItem += (float) ($item['subtotal'] ?? 0);
}

$totalTagihan = (float) ($trx['total'] ?? 0);
$diskon       = (float) ($trx['diskon'] ?? 0);
$pajak        = (float) ($trx['pajak'] ?? 0);
$metode       = (string) ($pembayaran['metode_pembayaran'] ?? 'Tunai');
$dibayar      = (float) ($pembayaran['jumlah_bayar'] ?? $totalTagihan);
$kembalian    = $metode === 'Tunai' ? max(0, $dibayar - $totalTagihan) : 0.0;
$waktu        = strtotime((string) ($trx['tanggal_transaksi'] ?? ''));
$status       = (string) ($pembayaran['status'] ?? $trx['status_bayar'] ?? 'lunas');
?>
<div class="struk-print struk-print-hidden" aria-hidden="true">
    <div class="struk-brand">
        <div class="struk-logo">
            <img src="<?= esc(base_url('assets/logo-mk.png'), 'attr') ?>" width="44" height="44" alt="Logo Optik Mekar Jaya">
        </div>
        <b>Optik Mekar Jaya</b>
        <span><?= esc($cabang['nama_cabang'] ?? current_branch_name()) ?></span>
        <?php if (! empty($cabang['telepon'])): ?>
            <span><?= esc($cabang['telepon']) ?></span>
        <?php endif; ?>
        <?php if (! empty($cabang['alamat'])): ?>
            <span><?= esc($cabang['alamat']) ?></span>
        <?php endif; ?>
    </div>

    <h1 class="struk-title">Struk Transaksi</h1>
    <div class="struk-code"><?= esc($trx['kode_transaksi'] ?? '-') ?></div>

    <div class="struk-meta">
        <div>
            <span>No. Nota</span>
            <b><?= esc($trx['kode_transaksi'] ?? '-') ?></b>
        </div>
        <div>
            <span>Tanggal</span>
            <b><?= $waktu !== false ? esc(tgl_id((string) $trx['tanggal_transaksi'], true)) : '-' ?></b>
        </div>
        <div>
            <span>Kasir</span>
            <b><?= esc($kasirNama ?: 'Kasir') ?></b>
        </div>
        <div>
            <span>Pelanggan</span>
            <b><?= esc($pelangganNama ?: '-') ?></b>
        </div>
    </div>

    <div class="struk-items">
        <?php foreach ($detail as $item): ?>
            <div class="struk-line">
                <span>
                    <b><?= esc($item['nama_barang'] ?? '-') ?></b>
                    <small><?= (int) ($item['jumlah'] ?? 0) ?> × <?= esc(rupiah($item['harga'] ?? 0)) ?></small>
                </span>
                <b><?= esc(rupiah($item['subtotal'] ?? 0)) ?></b>
            </div>
        <?php endforeach; ?>
        <?php if ($detail === []): ?>
            <span class="struk-empty">Tidak ada rincian produk.</span>
        <?php endif; ?>
        <div class="struk-item-count"><?= $jumlahItem ?> item</div>
    </div>

    <div class="struk-totals">
        <div>
            <span>Subtotal</span>
            <b><?= esc(rupiah($subtotalItem)) ?></b>
        </div>
        <div>
            <span>Diskon</span>
            <b><?= esc(rupiah($diskon)) ?></b>
        </div>
        <?php if ($pajak > 0): ?>
            <div>
                <span>Pajak</span>
                <b><?= esc(rupiah($pajak)) ?></b>
            </div>
        <?php endif; ?>
        <div class="struk-grand">
            <span>Total</span>
            <b><?= esc(rupiah($totalTagihan)) ?></b>
        </div>
        <?php if ($metode === 'Tunai'): ?>
            <div>
                <span>Tunai (Dibayar)</span>
                <b><?= esc(rupiah($dibayar)) ?></b>
            </div>
            <div>
                <span>Kembalian</span>
                <b><?= esc(rupiah($kembalian)) ?></b>
            </div>
        <?php endif; ?>
    </div>

    <div class="struk-foot">
        <span>Metode: <?= esc($metode) ?> · Status: <?= esc(label_status($status)) ?></span>
        <b>Terima kasih telah berbelanja.</b>
        <span>Barang yang sudah dibeli tidak dapat ditukar.</span>
    </div>
</div>
