<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static fn (array $ubah): string => '?' . http_build_query(array_merge([
    'status' => $status,
    'q'      => $cariQ,
    'buka'   => $buka ?: null,
], $ubah));

$filterList = [
    'Semua'      => '',
    'Selesai'    => 'selesai',
    'Pending'    => 'pending',
    'Dibatalkan' => 'dibatalkan',
];

$bulanId    = [1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
$rentang    = '01 ' . $bulanId[(int) date('n')] . ' ' . date('Y') . ' – ' . date('t') . ' ' . $bulanId[(int) date('n')] . ' ' . date('Y');
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs"><b>Kasir</b> › Riwayat Transaksi</div>
        <div class="pagehead-main">
            <div>
                <div class="overline">RIWAYAT TRANSAKSI</div>
                <h1>Riwayat Transaksi</h1>
                <p>Lihat dan cari semua transaksi yang pernah dilakukan</p>
            </div>
            <div class="pagehead-actions">
                <span class="select-pill" style="display:inline-flex;align-items:center;gap:9px">
                    <?= icon('calendar-days', 15) ?>
                    <?= esc($rentang) ?>
                </span>
            </div>
        </div>
    </div>

    <div class="toolbar">
        <form method="get" action="<?= site_url('kasir/riwayat') ?>">
            <input type="hidden" name="status" value="<?= esc($status) ?>">
            <label class="toolbar-search">
                <?= icon('search', 16) ?>
                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nomor transaksi, nama pelanggan, atau produk...">
            </label>
        </form>

        <div class="toolbar-chips">
            <?php foreach ($filterList as $label => $kunci): ?>
                <a class="chip <?= $status === $kunci ? 'active' : '' ?>" href="<?= site_url('kasir/riwayat' . $qs(['status' => $kunci, 'buka' => null])) ?>">
                    <?= esc($label) ?>
                </a>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="table-wrap">
        <table class="tt">
            <thead>
                <tr>
                    <th>NO. TRANSAKSI</th>
                    <th>TANGGAL</th>
                    <th>PELANGGAN</th>
                    <th>JENIS</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th class="tt-right">AKSI</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($rows as $t): ?>
                    <?php
                    $id       = (int) $t['id_transaksi'];
                    $terbuka  = $buka === $id;
                    $items    = $detailMap[$id] ?? [];
                    $subtotal = 0.0;
                    foreach ($items as $it) {
                        $subtotal += (float) $it['subtotal'];
                    }
                    $label = $t['jenis'] === 'pemesanan' ? 'Lihat Resep' : 'Lihat Detail';
                    ?>
                    <tr class="<?= $terbuka ? 'is-active' : '' ?>">
                        <td>
                            <div class="tt-num"><?= esc($t['kode_transaksi']) ?></div>
                            <div class="tt-sub"><?= esc(date('H:i', strtotime($t['tanggal_transaksi']))) ?> WIB</div>
                        </td>
                        <td><?= esc(tgl_id($t['tanggal_transaksi'])) ?></td>
                        <td>
                            <div class="tt-num" style="font-size:13px"><?= esc($t['nama_pelanggan'] ?? '-') ?></div>
                            <div class="tt-sub"><?= esc($t['no_hp'] ?? '-') ?></div>
                        </td>
                        <td>
                            <span class="type-chip">
                                <?= icon($t['jenis'] === 'pemesanan' ? 'file-text' : 'receipt', 14) ?>
                                <?= $t['jenis'] === 'pemesanan' ? 'Pemesanan' : 'Pembelian' ?>
                            </span>
                        </td>
                        <td class="tt-money"><?= rupiah($t['total']) ?></td>
                        <td><?= status_pill($t['status']) ?></td>
                        <td class="tt-right">
                            <a class="link-action" href="<?= site_url('kasir/riwayat' . $qs(['buka' => $terbuka ? null : $id])) ?>">
                                <?= esc($label) ?>
                                <?= icon('chevron-down', 15) ?>
                            </a>
                        </td>
                    </tr>

                    <?php if ($terbuka): ?>
                        <tr class="trx-expand-row">
                            <td colspan="7" style="padding:8px 10px 14px">
                                <div class="trx-detail">
                                    <div>
                                        <?php if ($t['jenis'] === 'pemesanan' && $resep !== null): ?>
                                            <h4>Resep Mata</h4>
                                            <table class="rx-table">
                                                <thead>
                                                    <tr>
                                                        <th>MATA</th>
                                                        <th>SPH</th>
                                                        <th>CYL</th>
                                                        <th>AXIS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>OD (Kanan)</td>
                                                        <td><?= esc($resep['od_sph'] ?? '-') ?></td>
                                                        <td><?= esc($resep['od_cyl'] ?? '-') ?></td>
                                                        <td><?= esc($resep['od_axis'] ?? '-') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td>OS (Kiri)</td>
                                                        <td><?= esc($resep['os_sph'] ?? '-') ?></td>
                                                        <td><?= esc($resep['os_cyl'] ?? '-') ?></td>
                                                        <td><?= esc($resep['os_axis'] ?? '-') ?></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        <?php else: ?>
                                            <h4>Detail Transaksi</h4>
                                            <div class="cell-person" style="margin-bottom:14px">
                                                <?= avatar($t['nama_pelanggan'] ?? '-', 40) ?>
                                                <span>
                                                    <b><?= esc($t['nama_pelanggan'] ?? '-') ?></b>
                                                    <span><?= esc($t['no_hp'] ?? '-') ?></span>
                                                </span>
                                            </div>
                                        <?php endif; ?>

                                        <h4>Produk (<?= count($items) ?> item)</h4>
                                        <div class="sub-list">
                                            <?php foreach ($items as $it): ?>
                                                <div class="sub-row">
                                                    <span>
                                                        <b style="color:var(--ink)"><?= esc($it['nama_barang']) ?></b>
                                                        <br>
                                                        <span style="font-size:12px;color:var(--muted)">
                                                            <?= esc($it['merek']) ?> · <?= (int) $it['jumlah'] ?> × <?= rupiah($it['harga']) ?>
                                                        </span>
                                                    </span>
                                                    <b><?= rupiah($it['subtotal']) ?></b>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>

                                    <div>
                                        <h4>Ringkasan</h4>
                                        <div class="sub-list">
                                            <div class="sub-row">
                                                <span>Subtotal</span>
                                                <b><?= rupiah($subtotal) ?></b>
                                            </div>
                                            <div class="sub-row">
                                                <span>Diskon</span>
                                                <b><?= rupiah($t['diskon']) ?></b>
                                            </div>
                                            <div class="sub-row">
                                                <span>Pajak (PPN 11%)</span>
                                                <b><?= rupiah($t['pajak']) ?></b>
                                            </div>
                                            <div class="sub-row total">
                                                <span>Total</span>
                                                <b><?= rupiah($t['total']) ?></b>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    <?php endif; ?>
                <?php endforeach; ?>

                <?php if ($rows === []): ?>
                    <tr>
                        <td colspan="7">
                            <div class="empty-note">Tidak ada transaksi yang cocok dengan filter.</div>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

        <div class="table-foot">
            <span class="foot-note">Menampilkan <?= count($rows) ?> dari <?= (int) $total ?> transaksi</span>
            <div class="foot-actions">
                <select class="select-pill" aria-label="Baris per halaman">
                    <option>10 per halaman</option>
                    <option>25 per halaman</option>
                    <option>50 per halaman</option>
                </select>
                <button class="btn btn-ghost btn-sm" type="button" onclick="window.print()">
                    <?= icon('printer', 15) ?>
                    Cetak Nota
                </button>
                <?php if ($bukaRow !== null): ?>
                    <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/transaksi/berhasil/' . (int) $bukaRow['id_transaksi']) ?>">
                        <?= icon('file-text', 15) ?>
                        Lihat Struk
                    </a>
                <?php else: ?>
                    <span class="btn btn-ghost btn-sm" style="opacity:.55;pointer-events:none">
                        <?= icon('file-text', 15) ?>
                        Lihat Struk
                    </span>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
<?= $this->endSection() ?>
