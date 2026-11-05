<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$filterList = [
    'Semua Status' => '',
    'Dipesan'      => 'dipesan',
    'Diproses'     => 'diproses',
    'Sudah Datang' => 'sudah_datang',
    'Selesai'      => 'selesai',
    'Dibatalkan'   => 'dibatalkan',
];
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <div class="overline">MANAJEMEN PESANAN</div>
                <h1>Pemesanan (PO)</h1>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-primary" href="<?= site_url('kasir/pemesanan?buat=1') ?>">
                    <?= icon('plus', 16) ?>
                    Buat PO Baru
                </a>
            </div>
        </div>
    </div>

    <div class="stat-row">
        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Pesanan Baru</div>
                <div class="stat-value"><?= str_pad((string) $hitung['dipesan'], 2, '0', STR_PAD_LEFT) ?></div>
                <div class="stat-caption">Menunggu pemrosesan admin</div>
            </div>
            <span class="stat-icon"><?= icon('package-plus', 22) ?></span>
        </div>
        <div class="stat-card tone-amber">
            <div class="stat-body">
                <div class="stat-label">Sedang Diproses</div>
                <div class="stat-value"><?= str_pad((string) $hitung['diproses'], 2, '0', STR_PAD_LEFT) ?></div>
                <div class="stat-caption">Dalam penanganan cabang</div>
            </div>
            <span class="stat-icon"><?= icon('clipboard-list', 22) ?></span>
        </div>
        <div class="stat-card tone-green">
            <div class="stat-body">
                <div class="stat-label">Sudah Datang</div>
                <div class="stat-value"><?= str_pad((string) $hitung['sudah_datang'], 2, '0', STR_PAD_LEFT) ?></div>
                <div class="stat-caption">Siap diambil pelanggan</div>
            </div>
            <span class="stat-icon"><?= icon('package-check', 22) ?></span>
        </div>
    </div>

    <?php if ($poKode !== null): ?>
        <div class="notice notice-ok" role="status">
            <?= icon('check', 16) ?>
            PO <?= esc($poKode) ?> berhasil dicatat dengan status <b>Dipesan</b> dan diteruskan ke Admin Cabang.
            <a class="link-action" href="<?= site_url('kasir/pemesanan/' . (int) $poId) ?>">
                Lihat Detail
                <?= icon('chevron-right', 15) ?>
            </a>
        </div>
    <?php endif; ?>

    <section class="section-block">
        <div class="section-head">
            <div>
                <h2>Daftar Pemesanan</h2>
                <div class="section-desc">Informasi pesanan pelanggan dan status terbaru dari Admin Cabang</div>
            </div>
        </div>

        <form class="toolbar" method="get" action="<?= site_url('kasir/pemesanan') ?>">
            <label class="toolbar-search">
                <?= icon('search', 16) ?>
                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nomor PO, nama pelanggan, atau nomor HP...">
            </label>

            <div class="toolbar-chips">
                <select class="chip-select" name="status" aria-label="Filter Status" onchange="this.form.submit()">
                    <?php foreach ($filterList as $label => $kunci): ?>
                        <option value="<?= esc($kunci) ?>" <?= $status === $kunci ? 'selected' : '' ?>>
                            <?= esc($label) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </form>

        <div class="table-wrap">
            <table class="tt">
                <thead>
                    <tr>
                        <th>NO. PO / TANGGAL</th>
                        <th>PELANGGAN</th>
                        <th>PRODUK DIPESAN</th>
                        <th class="tt-center">STATUS PO</th>
                        <th class="tt-right">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rows as $o): ?>
                        <?php
                        $labelProduk = $o['produk_label'] !== null && $o['produk_label'] !== ''
                            ? explode('|', $o['produk_label'])
                            : [];
                        ?>
                        <tr>
                            <td>
                                <div class="tt-num"><?= esc($o['kode_po']) ?></div>
                                <div class="tt-sub"><?= esc(tgl_id($o['tanggal_po'])) ?></div>
                            </td>
                            <td>
                                <div class="cell-person">
                                    <?= avatar($o['nama_pelanggan'] ?? '-', 40) ?>
                                    <span>
                                        <b><?= esc($o['nama_pelanggan'] ?? '-') ?></b>
                                        <span><?= esc($o['no_hp'] ?? '-') ?></span>
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="tt-num" style="font-size:13px"><?= esc($labelProduk[0] ?? '-') ?></div>
                                <div class="tt-sub"><?= esc($labelProduk[1] ?? ((int) $o['jml_item'] . ' item')) ?></div>
                            </td>
                            <td class="tt-center"><?= status_pill($o['status']) ?></td>
                            <td class="tt-right">
                                <a class="link-action" href="<?= site_url('kasir/pemesanan/' . (int) $o['id_po']) ?>">
                                    Lihat Detail
                                    <?= icon('chevron-right', 15) ?>
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if ($rows === []): ?>
                        <tr>
                            <td colspan="5">
                                <div class="empty-note">Tidak ada pesanan yang cocok dengan filter.</div>
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            <div class="table-foot">
                <span class="foot-note">Menampilkan <?= count($rows) ?> dari <?= (int) $total ?> pesanan</span>
            </div>
        </div>
    </section>
</div>

<?php if ($buat): ?>
    <div class="overlay">
        <div class="drawer" role="dialog" aria-modal="true">
            <div class="drawer-head">
                <div>
                    <h2>Buat PO Baru</h2>
                    <div class="section-desc">Status awal Dipesan · diteruskan ke Admin Cabang</div>
                </div>
                <a class="icon-pill" aria-label="Tutup" href="<?= site_url('kasir/pemesanan') ?>">
                    <?= icon('x', 18) ?>
                </a>
            </div>

            <form class="drawer-form" method="post" action="<?= site_url('kasir/pemesanan') ?>">
                <?= csrf_field() ?>

                <label class="afield">
                    <span>Pelanggan</span>
                    <select name="pelanggan_id" required>
                        <option value="">Pilih pelanggan</option>
                        <?php foreach ($pelanggan as $c): ?>
                            <option value="<?= (int) $c['id_pelanggan'] ?>" <?= (int) old('pelanggan_id', 0) === (int) $c['id_pelanggan'] ? 'selected' : '' ?>>
                                <?= esc($c['nama_pelanggan']) ?> · PLG-<?= str_pad((string) $c['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </label>

                <label class="afield">
                    <span>Produk (frame / lensa)</span>
                    <select name="barang_id" required>
                        <option value="">Pilih produk</option>
                        <?php foreach ($produk as $p): ?>
                            <option value="<?= (int) $p['id'] ?>" <?= (int) old('barang_id', $barangId) === (int) $p['id'] ? 'selected' : '' ?>>
                                <?= esc($p['nama_barang']) ?> · <?= esc($p['merek']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </label>

                <label class="afield">
                    <span>Jumlah</span>
                    <input name="qty" inputmode="numeric" value="<?= esc(old('qty', '1'), 'attr') ?>" placeholder="cth. 1" required>
                </label>

                <label class="afield">
                    <span>Catatan (opsional)</span>
                    <input name="catatan" value="<?= esc(old('catatan', ''), 'attr') ?>" placeholder="cth. lensa sesuai resep">
                </label>

                <?php if ($pelanggan === []): ?>
                    <div class="notice">Tambahkan pelanggan terlebih dahulu sebelum membuat PO.</div>
                <?php endif; ?>
                <?php if ($produk === []): ?>
                    <div class="notice">Belum ada produk frame atau lensa aktif untuk dipesan.</div>
                <?php endif; ?>

                <div class="tt-sub" style="font-weight:600">
                    Snapshot ukuran lensa disalin otomatis dari resep terakhir pelanggan saat PO dibuat.
                </div>

                <div class="drawer-foot">
                    <a class="btn btn-ghost" href="<?= site_url('kasir/pemesanan') ?>">Batal</a>
                    <button type="submit" class="btn btn-primary" <?= $pelanggan === [] || $produk === [] ? 'disabled' : '' ?>>Buat PO</button>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>
<?= $this->endSection() ?>
