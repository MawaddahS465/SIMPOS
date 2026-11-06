<?php
$metodeTransaksi = (string) ($trx['metode_pembayaran'] ?? 'Tunai');
$waktu        = strtotime((string) ($trx['tanggal_transaksi'] ?? ''));
$subtotal     = (float) ($trx['total'] ?? 0) + (float) ($trx['diskon'] ?? 0);
$dibayar      = (float) ($trx['jumlah_bayar'] ?? $trx['total'] ?? 0);
$kembalian    = $metodeTransaksi === 'Tunai' ? max(0, $dibayar - (float) ($trx['total'] ?? 0)) : 0.0;
$filterParams = array_filter([
    'status'  => $status,
    'metode'  => $metode,
    'q'       => $cariQ,
    'periode' => $periode,
    'dari'    => $dari,
    'sampai'  => $sampai,
], static fn ($value): bool => $value !== null && $value !== '');
$detailCloseUrl = site_url('kasir/riwayat')
    . ($filterParams === [] ? '' : '?' . http_build_query($filterParams));
$metodeIkonMap = [
    'Tunai'              => 'banknote',
    'QRIS'               => 'qr-code',
    'Transfer Bank'      => 'wallet',
    'Kartu Debit/Kredit' => 'credit-card',
    'E-Wallet'           => 'wallet',
];
?>
<div class="overlay riwayat-overlay">
    <a
        class="riwayat-overlay-close"
        href="<?= esc($detailCloseUrl, 'attr') ?>"
        aria-label="Tutup detail transaksi"
        tabindex="-1"
        data-riwayat-detail-close
    ></a>
    <aside
        class="drawer riwayat-detail"
        id="riwayat-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="riwayat-detail-title"
    >
        <div class="drawer-head">
            <div class="detail-head">
                <?= avatar($trx['nama_pelanggan'] ?? '-', 48) ?>
                <div>
                    <b id="riwayat-detail-title"><?= esc($trx['nama_pelanggan'] ?? '-') ?></b>
                    <span><?= esc($trx['kode_transaksi'] ?? '-') ?> · <?= $waktu !== false ? esc(date('H:i', $waktu)) : '-' ?></span>
                </div>
            </div>
            <a
                class="icon-pill"
                href="<?= esc($detailCloseUrl, 'attr') ?>"
                aria-label="Tutup detail transaksi"
                data-riwayat-detail-close
            >
                <?= icon('x', 18) ?>
            </a>
        </div>

        <div class="detail-badges"><?= status_pill($trx['status'] ?? '') ?></div>

        <div class="detail-rows">
            <div class="detail-row">
                <span>Tanggal</span>
                <b><?= esc(tgl_id($trx['tanggal_transaksi'] ?? null)) ?></b>
            </div>
            <div class="detail-row">
                <span>Nomor HP</span>
                <b><?= esc($trx['no_hp'] ?? '-') ?></b>
            </div>
            <div class="detail-row">
                <span>Metode</span>
                <b style="display:inline-flex;align-items:center;gap:6px">
                    <?= icon($metodeIkonMap[$metodeTransaksi] ?? 'wallet', 14) ?>
                    <?= esc($metodeTransaksi) ?>
                </b>
            </div>
        </div>

        <div>
            <div class="mini-label">PRODUK (<?= count($detail) ?> ITEM)</div>
            <div class="sub-list" style="margin-top:8px">
                <?php foreach ($detail as $item): ?>
                    <div class="sub-row">
                        <span>
                            <b style="color:var(--ink)"><?= esc($item['nama_barang'] ?? '-') ?></b>
                            <br>
                            <span style="font-size:12px;color:var(--muted)">
                                <?= esc($item['merek'] ?? '-') ?> · <?= (int) ($item['jumlah'] ?? 0) ?> × <?= esc(rupiah($item['harga'] ?? 0)) ?>
                            </span>
                        </span>
                        <b><?= esc(rupiah($item['subtotal'] ?? 0)) ?></b>
                    </div>
                <?php endforeach; ?>
                <?php if ($detail === []): ?>
                    <div class="empty-note" style="padding:12px 0">Tidak ada rincian produk.</div>
                <?php endif; ?>
            </div>
        </div>

        <?php if (($trx['jenis'] ?? '') === 'pemesanan'): ?>
            <div>
                <div class="mini-label">RESEP MATA</div>
                <?php if ($resep !== null): ?>
                    <div class="rx-mini" style="margin-top:10px">
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
                    <div class="empty-note" style="padding:12px 0">Arsip resep pelanggan ini tidak ditemukan.</div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <div>
            <div class="mini-label">RINGKASAN PEMBAYARAN</div>
            <div class="sub-list" style="margin-top:8px">
                <div class="sub-row">
                    <span>Subtotal</span>
                    <b><?= esc(rupiah($subtotal)) ?></b>
                </div>
                <div class="sub-row">
                    <span>Diskon</span>
                    <b><?= esc(rupiah($trx['diskon'] ?? 0)) ?></b>
                </div>
                <div class="sub-row total">
                    <span>Total Tagihan</span>
                    <b><?= esc(rupiah($trx['total'] ?? 0)) ?></b>
                </div>
                <?php if ($metodeTransaksi === 'Tunai'): ?>
                    <div class="sub-row">
                        <span>Jumlah Dibayar</span>
                        <b><?= esc(rupiah($dibayar)) ?></b>
                    </div>
                    <div class="sub-row">
                        <span>Kembalian</span>
                        <b style="color:var(--ok-ink)"><?= esc(rupiah($kembalian)) ?></b>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="drawer-foot">
            <a class="btn btn-ghost" href="<?= esc($detailCloseUrl, 'attr') ?>" data-riwayat-detail-close>Tutup</a>
            <button class="btn btn-primary" type="button" onclick="window.print()">
                <?= icon('printer', 16) ?>
                Cetak Struk
            </button>
        </div>
        <?= $this->include('kasir/_struk_transaksi') ?>
    </aside>
</div>
