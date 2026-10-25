<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$flow = ['dipesan', 'diproses', 'sudah_datang', 'selesai'];
$flowLabel = ['dipesan' => 'Dipesan', 'diproses' => 'Diproses', 'sudah_datang' => 'Sudah Datang', 'selesai' => 'Selesai'];
$flowDesc = [
    'dipesan'      => 'Menunggu proses',
    'diproses'     => 'Sedang diproses',
    'sudah_datang' => 'Siap dinubungi',
    'selesai'      => 'Pesanan selesai',
];

$statusNow = $po['status'] === 'menunggu' ? 'dipesan' : $po['status'];
$current   = array_search($statusNow, $flow, true);
$current   = $current === false ? 0 : $current;

$adaResep = ! empty($po['od_sph']) || ! empty($po['os_sph']) || ! empty($po['pd']);
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
                <p>Pantau pesanan pelanggan dan perkembangan status dari Admin Cabang.</p>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-ghost" href="<?= site_url('kasir/pemesanan') ?>">
                    <?= icon('arrow-left', 16) ?>
                    Daftar PO
                </a>
            </div>
        </div>
    </div>

    <div class="po-status-card">
        <div>
            <div class="po-mini-label">NOMOR PEMESANAN</div>
            <div class="po-big-no"><?= esc($po['kode_po']) ?></div>
            <div class="po-created">Dibuat <?= esc(tgl_id($po['tanggal_po'], true)) ?></div>
        </div>
        <div class="po-status-right">
            <div class="po-mini-label">STATUS PESANAN</div>
            <?= status_pill($po['status']) ?>
            <span style="font-size:12.5px;color:var(--muted);font-weight:600"><?= esc($flowDesc[$statusNow] ?? '-') ?></span>
        </div>
    </div>

    <section class="panel" style="display:flex;flex-direction:column;gap:18px">
        <div class="section-head">
            <div>
                <h2>Progres Pemesanan</h2>
                <div class="section-desc">Status diperbarui oleh Admin Cabang</div>
            </div>
        </div>
        <div class="progress">
            <?php foreach ($flow as $i => $step): ?>
                <div class="pnode <?= $i < $current ? 'done' : '' ?> <?= $i === $current ? 'current' : '' ?>">
                    <span class="pdot"><?= $i < $current ? icon('check', 14) : $i + 1 ?></span>
                    <b><?= esc($flowLabel[$step]) ?></b>
                    <span><?= $i === $current ? esc(tgl_id($po['tanggal_po'])) : esc($flowDesc[$step]) ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </section>

    <div class="two-col">
        <div style="display:flex;flex-direction:column;gap:20px">
            <section class="co-card">
                <div class="section-head">
                    <h2>Data Pelanggan</h2>
                </div>
                <div class="cust-card">
                    <?= avatar($po['nama_pelanggan'] ?? '-', 46) ?>
                    <div class="cc-body">
                        <b><?= esc($po['nama_pelanggan'] ?? '-') ?></b>
                        <div class="cc-meta">
                            <span>PLG-<?= str_pad((string) $po['pelanggan_id'], 4, '0', STR_PAD_LEFT) ?></span>
                            <span><?= esc($po['no_hp'] ?? '-') ?></span>
                        </div>
                        <?php if (! empty($po['alamat'])): ?>
                            <div class="cc-meta"><?= esc($po['alamat']) ?></div>
                        <?php endif; ?>
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
                    <div class="cart-line">
                        <span class="cl-ico"><?= icon('glasses', 20) ?></span>
                        <span class="cl-body">
                            <b><?= esc($d['nama_barang']) ?></b>
                            <span><?= esc($d['merek']) ?> · <?= esc($d['jenis']) ?> · <?= rupiah($d['harga']) ?></span>
                        </span>
                        <b style="font-size:13.5px">×<?= (int) $d['jumlah'] ?></b>
                    </div>
                <?php endforeach; ?>
            </section>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
            <section class="co-card">
                <div class="section-head">
                    <h2>Resep Mata</h2>
                </div>
                <?php if ($adaResep): ?>
                    <table class="rx-table">
                        <thead>
                            <tr>
                                <th>MATA</th>
                                <th>SPH</th>
                                <th>CYL</th>
                                <th>AXIS</th>
                                <th>ADD</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>OD (Kanan)</td>
                                <td><?= esc($po['od_sph'] ?? '-') ?></td>
                                <td><?= esc($po['od_cyl'] ?? '-') ?></td>
                                <td><?= esc($po['od_axis'] ?? '-') ?></td>
                                <td><?= esc($po['add_power'] ?? '-') ?></td>
                            </tr>
                            <tr>
                                <td>OS (Kiri)</td>
                                <td><?= esc($po['os_sph'] ?? '-') ?></td>
                                <td><?= esc($po['os_cyl'] ?? '-') ?></td>
                                <td><?= esc($po['os_axis'] ?? '-') ?></td>
                                <td><?= esc($po['add_power'] ?? '-') ?></td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="tt-sub" style="font-weight:600">Resep tersimpan bersama pesanan ini.</div>
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
                        Hubungi pelanggan saat pesanan tersedia.
                    </div>
                </div>
            </section>
        </div>
    </div>

    <div class="tt-sub" style="padding:0 6px;font-weight:600">
        Kasir dapat memantau PO. Proses dan perubahan status ditangani Admin Cabang.
    </div>
</div>
<?= $this->endSection() ?>
