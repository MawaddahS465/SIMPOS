<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$flow      = ['dipesan', 'diproses', 'sudah_datang', 'selesai'];
$flowLabel = ['dipesan' => 'Dipesan', 'diproses' => 'Diproses', 'sudah_datang' => 'Sudah Datang', 'selesai' => 'Selesai'];
$flowDesc  = [
    'dipesan'      => 'Menunggu diproses Admin Cabang',
    'diproses'     => 'Sedang disiapkan Admin Cabang',
    'sudah_datang' => 'Barang tersedia & siap diambil pelanggan',
    'selesai'      => 'Pesanan selesai & telah diambil pelanggan',
    'dibatalkan'   => 'Dibatalkan oleh Admin Cabang',
];

$statusNow = $po['status'] === 'menunggu' ? 'dipesan' : $po['status'];
$cancelled = $statusNow === 'dibatalkan';
$current   = array_search($statusNow, $flow, true);
$current   = $current === false ? 0 : $current;

$adaResep  = ! empty($po['resep_id']);
$canPickup = $statusNow === 'sudah_datang';
$total     = (float) ($po['total'] ?? 0);
$kodePlg   = 'PLG-' . str_pad((string) $po['pelanggan_id'], 4, '0', STR_PAD_LEFT);
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs">
            <a href="<?= site_url('kasir/dashboard') ?>">Kasir</a> ›
            <a href="<?= site_url('kasir/pemesanan') ?>">Pemesanan (PO)</a> ›
            <b>Detail PO</b>
        </div>
        <div class="pagehead-main">
            <div>
                <div class="overline">DETAIL PEMESANAN</div>
                <h1>Detail Pemesanan</h1>
                <p>Informasi pesanan pelanggan dan tahapan status yang diperbarui oleh Admin Cabang.</p>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-ghost" href="<?= site_url('kasir/pemesanan') ?>">
                    <?= icon('arrow-left', 16) ?>
                    Daftar PO
                </a>
                <?php if ($canPickup): ?>
                    <a class="btn btn-primary" href="<?= site_url('kasir/pemesanan/' . (int) $po['id_po'] . '/pengambilan') ?>">
                        <?= icon('shopping-bag', 16) ?>
                        Proses Pengambilan
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <?php if ($canPickup): ?>
        <div class="notice notice-ok" role="status">
            <?= icon('package-check', 16) ?>
            Barang sudah datang. Periksa data pesanan dan selesaikan pembayaran saat pelanggan mengambil pesanan.
        </div>
    <?php endif; ?>

    <div class="po-status-card">
        <div>
            <div class="po-mini-label">NOMOR PEMESANAN</div>
            <div class="po-big-no"><?= esc($po['kode_po']) ?></div>
            <div class="po-created">Dibuat <?= esc(tgl_id($po['tanggal_po'], true)) ?></div>
        </div>
        <div class="po-status-right">
            <div class="po-mini-label">STATUS PESANAN</div>
            <?= status_pill($statusNow) ?>
            <span style="font-size:12.5px;color:var(--muted);font-weight:600"><?= esc($flowDesc[$statusNow] ?? '-') ?></span>
        </div>
    </div>

    <section class="panel" style="display:flex;flex-direction:column;gap:18px">
        <div class="section-head">
            <div>
                <h2>Progres Pemesanan</h2>
                <div class="section-desc">Status diperbarui oleh Admin Cabang secara real-time</div>
            </div>
        </div>
        <div class="progress" style="opacity:<?= $cancelled ? '0.45' : '1' ?>">
            <?php foreach ($flow as $i => $step): ?>
                <?php
                $done  = $i < $current || $statusNow === 'selesai';
                $kelas = trim(($done ? 'done' : '') . ' ' . ($i === $current && $statusNow !== 'selesai' ? 'current' : ''));
                ?>
                <div class="pnode <?= $kelas ?>">
                    <span class="pdot"><?= $done ? icon('check', 14) : $i + 1 ?></span>
                    <b><?= esc($flowLabel[$step]) ?></b>
                    <span>
                        <?= esc($i === $current ? tgl_id($po['tanggal_po'], true) : $flowDesc[$step]) ?>
                    </span>
                </div>
            <?php endforeach; ?>
        </div>
        <?php if ($cancelled): ?>
            <div class="notice" role="status">
                PO ini dibatalkan oleh Admin Cabang.
            </div>
        <?php endif; ?>
    </section>

    <div class="po-detail-sections">
            <section class="co-card">
                <div class="section-head">
                    <h2>Data Pelanggan</h2>
                </div>
                <div class="cust-card">
                    <?= avatar($po['nama_pelanggan'] ?? '-', 46) ?>
                    <div class="cc-body">
                        <b><?= esc($po['nama_pelanggan'] ?? '-') ?></b>
                        <div class="cc-meta">
                            <span><?= esc($kodePlg) ?></span>
                            <span><?= esc($po['no_hp'] ?? '-') ?></span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Produk yang Dipesan</h2>
                    <div class="section-action">
                        <span class="tag-mini"><?= count($detail) ?> item</span>
                    </div>
                </div>
                <?php foreach ($detail as $d): ?>
                    <?php $subtotal = (float) ($d['subtotal'] ?? ((float) $d['harga'] * (int) $d['jumlah'])); ?>
                    <div class="cart-line">
                        <span class="cl-ico"><?= icon('glasses', 20) ?></span>
                        <span class="cl-body">
                            <b><?= esc($d['nama_barang']) ?></b>
                            <span><?= esc($d['jenis']) ?> · <?= esc($d['merek']) ?></span>
                        </span>
                        <span style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
                            <b style="font-size:13.5px">×<?= (int) $d['jumlah'] ?></b>
                            <span style="font-size:11.5px;color:var(--muted);font-weight:700">
                                <?= esc(rupiah($subtotal)) ?>
                            </span>
                        </span>
                    </div>
                <?php endforeach; ?>
                <?php if ($total > 0): ?>
                    <div class="simple-total-bar" style="margin-top:12px">
                        <span>Total Estimasi Pesanan</span>
                        <b><?= esc(rupiah($total)) ?></b>
                    </div>
                <?php endif; ?>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Resep Mata (Snapshot PO)</h2>
                </div>
                <?php if ($adaResep): ?>
                    <div class="table-wrap">
                        <table class="rx-table">
                            <thead>
                                <tr>
                                    <th>MATA</th>
                                    <th>SPH</th>
                                    <th>CYL</th>
                                    <th>AXIS</th>
                                    <th>ADD</th>
                                    <th>PD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>OD (Kanan)</td>
                                    <td><?= esc($po['od_sph'] ?? '-') ?></td>
                                    <td><?= esc($po['od_cyl'] ?? '-') ?></td>
                                    <td><?= esc($po['od_axis'] ?? '-') ?></td>
                                    <td><?= esc($po['add_power'] ?? '-') ?></td>
                                    <td><?= esc($po['pd'] ?? '-') ?></td>
                                </tr>
                                <tr>
                                    <td>OS (Kiri)</td>
                                    <td><?= esc($po['os_sph'] ?? '-') ?></td>
                                    <td><?= esc($po['os_cyl'] ?? '-') ?></td>
                                    <td><?= esc($po['os_axis'] ?? '-') ?></td>
                                    <td><?= esc($po['add_power'] ?? '-') ?></td>
                                    <td><?= esc($po['pd'] ?? '-') ?></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="tt-sub" style="font-weight:600">Ukuran lensa tersimpan pada detail PO ini.</div>
                <?php else: ?>
                    <div class="empty-note">PO ini tidak menyertakan resep mata.</div>
                <?php endif; ?>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Catatan Pesanan</h2>
                </div>
                <div>
                    <div class="note-line">
                        <i></i>
                        <?= esc($po['catatan'] ?: 'Tidak ada catatan tambahan untuk pesanan ini.') ?>
                    </div>
                    <div class="note-line">
                        <i></i>
                        Hubungi pelanggan (<?= esc($po['no_hp'] ?? '-') ?>) saat pesanan berstatus Sudah Datang.
                    </div>
                </div>
            </section>
    </div>

    <div class="tt-sub" style="padding:0 6px;font-weight:600">
        Kasir mencatat pemesanan dan memantau status PO. Pemrosesan dan pembaruan status PO ditangani oleh Admin Cabang.
    </div>
</div>
<?= $this->endSection() ?>
