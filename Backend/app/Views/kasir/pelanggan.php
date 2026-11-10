<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static fn (array $ubah): string => '?' . http_build_query(array_merge([
    'q'      => $cariQ,
    'filter' => $filter,
    'pilih'  => $terpilih['id_pelanggan'] ?? null,
], $ubah));

$filterList = ['semua' => 'Semua Pelanggan', 'resep' => 'Punya Resep', 'po' => 'PO Aktif'];

$tambah = request()->getGet('tambah') === '1';
$ubah   = request()->getGet('ubah') === '1' && $terpilih !== null;
$drawer = $tambah || $ubah;
$showDetail = (int) request()->getGet('pilih') > 0 && ! $drawer && $terpilih !== null;
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <h1>Data Pelanggan</h1>
                <p>Cari pelanggan berdasarkan nama atau nomor HP, kelola data pelanggan, dan catat riwayat resep.</p>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-primary" href="<?= site_url('kasir/pelanggan' . $qs(['tambah' => 1, 'ubah' => null])) ?>">
                    <?= icon('user-plus', 16) ?>
                    Tambah Pelanggan
                </a>
            </div>
        </div>
    </div>

    <div class="stat-row">
        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Total pelanggan</div>
                <div class="stat-value"><?= (int) $total ?></div>
                <div class="stat-caption">Terdaftar di cabang ini</div>
            </div>
            <span class="stat-icon"><?= icon('users', 22) ?></span>
        </div>
        <div class="stat-card tone-blue">
            <div class="stat-body">
                <div class="stat-label">Pelanggan dengan resep</div>
                <div class="stat-value"><?= (int) $punyaResep ?></div>
                <div class="stat-caption">Memiliki arsip resep</div>
            </div>
            <span class="stat-icon"><?= icon('glasses', 22) ?></span>
        </div>
        <div class="stat-card tone-amber">
            <div class="stat-body">
                <div class="stat-label">Pelanggan dengan PO aktif</div>
                <div class="stat-value"><?= (int) $punyaPo ?></div>
                <div class="stat-caption">Pesanan belum selesai</div>
            </div>
            <span class="stat-icon"><?= icon('message-square', 22) ?></span>
        </div>
    </div>

    <section class="section-block pelanggan-list">
        <div class="section-head">
            <div>
                <h2>Daftar Pelanggan</h2>
                <div class="section-desc">Informasi pelanggan dan ringkasan aktivitas</div>
            </div>
            <div class="section-action">
                <span class="foot-note" style="color:var(--muted);font-size:12.5px;font-weight:700">
                    <?= count($rows) ?> dari <?= (int) $total ?> data
                </span>
            </div>
        </div>

        <form class="toolbar pelanggan-toolbar" method="get" action="<?= site_url('kasir/pelanggan') ?>">
            <label class="toolbar-search">
                <?= icon('search', 16) ?>
                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nama, kode, atau nomor HP pelanggan...">
            </label>
            <select class="chip-select" name="filter" aria-label="Filter pelanggan" onchange="this.form.submit()">
                <?php foreach ($filterList as $kunci => $label): ?>
                    <option value="<?= esc($kunci) ?>" <?= $filter === $kunci ? 'selected' : '' ?>>
                        <?= esc($label) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </form>

        <div class="table-wrap">
            <table class="tt">
                <thead>
                    <tr>
                        <th>NAMA PELANGGAN</th>
                        <th>NOMOR HP</th>
                        <th class="tt-center">RESEP</th>
                        <th>PO AKTIF</th>
                        <th class="tt-right">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rows as $c): ?>
                        <?php
                        $editUrl = site_url('kasir/pelanggan' . $qs(['pilih' => (int) $c['id_pelanggan'], 'tambah' => null, 'ubah' => 1]));
                        ?>
                        <tr>
                            <td>
                                <div class="cell-person">
                                    <?= avatar($c['nama_pelanggan'], 40) ?>
                                    <span>
                                        <b><?= esc($c['nama_pelanggan']) ?></b>
                                        <span>PLG-<?= str_pad((string) $c['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?></span>
                                    </span>
                                </div>
                            </td>
                            <td><?= esc($c['no_hp'] ?? '-') ?></td>
                            <td class="tt-center"><?= status_text((int) $c['jml_resep'] > 0 ? 'Ada' : 'Belum ada') ?></td>
                            <td>
                                <span class="tt-sub" style="margin-top:0">
                                    <?= (int) $c['po_aktif'] > 0 ? (int) $c['po_aktif'] . ' pesanan' : 'Tidak ada' ?>
                                </span>
                            </td>
                            <td class="tt-right">
                                <span class="row-actions">
                                    <a class="link-action" href="<?= $editUrl ?>">
                                        <?= icon('pencil', 14) ?>
                                        Edit
                                    </a>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if ($rows === []): ?>
                        <tr>
                            <td colspan="5"><div class="empty-note">Pelanggan tidak ditemukan.</div></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>

    <?php if ($showDetail): ?>
        <div class="overlay po-modal-overlay pelanggan-detail-overlay">
            <aside class="detail-panel pelanggan-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="pelanggan-detail-title">
                <div class="detail-dialog-head">
                    <span id="pelanggan-detail-title" class="mini-label">DETAIL PELANGGAN</span>
                    <a class="icon-pill" aria-label="Tutup detail" href="<?= site_url('kasir/pelanggan' . $qs(['pilih' => null])) ?>">
                        <?= icon('x', 18) ?>
                    </a>
                </div>
            <?php if ($terpilih !== null): ?>
                <div class="detail-head">
                    <?= avatar($terpilih['nama_pelanggan'], 48) ?>
                    <div>
                        <b><?= esc($terpilih['nama_pelanggan']) ?></b>
                        <span>PLG-<?= str_pad((string) $terpilih['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?></span>
                    </div>
                </div>

                <div class="detail-badges">
                    <span class="tag-mini">Pelanggan terdaftar</span>
                    <?php if ((int) $terpilih['po_aktif'] > 0): ?>
                        <span class="tag-mini"><?= (int) $terpilih['po_aktif'] ?> PO aktif</span>
                    <?php endif; ?>
                </div>

                <div class="detail-rows">
                    <div class="detail-row">
                        <span>Nomor HP</span>
                        <b><?= esc($terpilih['no_hp'] ?? '-') ?></b>
                    </div>
                    <div class="detail-row">
                        <span>Cabang</span>
                        <b><?= esc(current_branch_name()) ?></b>
                    </div>
                    <div class="detail-row">
                        <span>Alamat</span>
                        <b style="max-width:190px;text-align:right"><?= esc($terpilih['alamat'] ?? '-') ?></b>
                    </div>
                </div>

                <a class="btn btn-ghost full" href="<?= site_url('kasir/pelanggan' . $qs(['ubah' => 1, 'tambah' => null])) ?>">
                    Edit Data
                </a>

                <div class="mini-label">DATA PELANGGAN</div>

                <div>
                    <div class="mini-label" style="color:var(--accent-ink)">RESEP MATA TERAKHIR</div>
                    <div class="detail-row">
                        <span>Resep <?= $resep !== null ? esc(tgl_id($resep['tanggal_resep'])) : '-' ?></span>
                        <?= status_text($resep !== null ? 'Tercatat' : 'Belum ada', false) ?>
                    </div>
                </div>

                <?php if ($resep !== null): ?>
                    <div class="rx-mini">
                        <div class="rx-eye">
                            <div class="ey-label">OD / KANAN</div>
                            <b><?= esc($resep['od_sph'] ?? '-') ?></b>
                            <span>CYL <?= esc($resep['od_cyl'] ?? '-') ?> · AXIS <?= esc($resep['od_axis'] ?? '-') ?></span>
                        </div>
                        <div class="rx-eye">
                            <div class="ey-label">OS / KIRI</div>
                            <b><?= esc($resep['os_sph'] ?? '-') ?></b>
                            <span>CYL <?= esc($resep['os_cyl'] ?? '-') ?> · AXIS <?= esc($resep['os_axis'] ?? '-') ?></span>
                        </div>
                    </div>
                    <a class="btn btn-ghost full" href="<?= site_url('kasir/resep?pilih=' . (int) $resep['id_resep']) ?>">Lihat Riwayat Resep</a>
                <?php else: ?>
                    <div class="empty-note">Belum ada resep tersimpan.</div>
                <?php endif; ?>

                <div class="mini-label">AKTIVITAS TERKAIT</div>
                <div>
                    <?php if ($poAktif !== null): ?>
                        <div class="act-line">
                            <b>PO <?= esc($poAktif['kode_po']) ?> — <?= esc(label_status($poAktif['status'])) ?></b>
                            <span>Status terbaru dari Admin Cabang</span>
                        </div>
                    <?php endif; ?>
                    <div class="act-line">
                        <b>Transaksi terakhir</b>
                        <span>
                            <?= $trxTerakhir !== null
                                ? esc(tgl_id($trxTerakhir['tanggal_transaksi'])) . ' · ' . rupiah($trxTerakhir['total'])
                                : 'Belum ada transaksi' ?>
                        </span>
                    </div>
                </div>
            <?php else: ?>
                <div class="empty-note">Pilih pelanggan untuk melihat detail.</div>
            <?php endif; ?>
            </aside>
        </div>
    <?php endif; ?>
</div>

<?php if ($drawer): ?>
    <div class="overlay">
        <div class="drawer" role="dialog" aria-modal="true">
            <div class="drawer-head">
                <div>
                    <h2><?= $ubah ? 'Edit Pelanggan' : 'Tambah Pelanggan' ?></h2>
                </div>
                <a class="icon-pill" aria-label="Tutup" href="<?= site_url('kasir/pelanggan') ?>">
                    <?= icon('x', 18) ?>
                </a>
            </div>

            <form class="drawer-form" method="post"
                  action="<?= $ubah ? site_url('kasir/pelanggan/ubah') : site_url('kasir/pelanggan') ?>">
                <?= csrf_field() ?>
                <?php if ($ubah): ?>
                    <input type="hidden" name="id_pelanggan" value="<?= (int) $terpilih['id_pelanggan'] ?>">
                <?php endif; ?>

                <label class="afield">
                    <span>Nama pelanggan</span>
                    <input name="nama_pelanggan" required minlength="2" value="<?= esc(old('nama_pelanggan', $ubah ? $terpilih['nama_pelanggan'] : ''), 'attr') ?>" placeholder="cth. Andi Saputra">
                </label>

                <label class="afield">
                    <span>Nomor HP</span>
                    <input name="no_hp" value="<?= esc(old('no_hp', $ubah ? ($terpilih['no_hp'] ?? '') : ''), 'attr') ?>" placeholder="cth. 0812 3456 7890">
                </label>

                <label class="afield">
                    <span>Alamat</span>
                    <input name="alamat" value="<?= esc(old('alamat', $ubah ? ($terpilih['alamat'] ?? '') : ''), 'attr') ?>" placeholder="cth. Jl. Khatib Sulaiman No. 12">
                </label>

                <div class="drawer-foot">
                    <a class="btn btn-ghost" href="<?= site_url('kasir/pelanggan') ?>">Batal</a>
                    <button type="submit" class="btn btn-primary"><?= $ubah ? 'Simpan Perubahan' : 'Tambah Pelanggan' ?></button>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>
<?= $this->endSection() ?>
