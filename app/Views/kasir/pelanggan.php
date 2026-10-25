<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static fn (array $ubah): string => '?' . http_build_query(array_merge([
    'q'      => $cariQ,
    'filter' => $filter,
    'pilih'  => $terpilih['id_pelanggan'] ?? null,
], $ubah));

$filterList = ['semua' => 'Semua', 'resep' => 'Punya resep', 'po' => 'PO aktif'];

$tambah = request()->getGet('tambah') === '1';
$ubah   = request()->getGet('ubah') === '1' && $terpilih !== null;
$drawer = $tambah || $ubah;
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs"><b>Kasir</b> › Pelanggan</div>
        <div class="pagehead-main">
            <div>
                <div class="overline">PENGELOLAAN PELANGGAN</div>
                <h1>Data Pelanggan</h1>
                <p>Cari informasi pelanggan dan kelola riwayat resep untuk pelayanan yang lebih cepat.</p>
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

    <div class="split">
        <section class="section-block">
            <div class="section-head">
                <div>
                    <h2>Daftar Pelanggan</h2>
                    <div class="section-desc">Informasi pelanggan dan ringkasan aktivitas</div>
                </div>
                <div class="section-action">
                    <span class="foot-note" style="color:var(--muted);font-size:12.5px;font-weight:700">
                        <?= (int) $total ?> data tersedia
                    </span>
                </div>
            </div>

            <div class="toolbar">
                <form method="get" action="<?= site_url('kasir/pelanggan') ?>">
                    <input type="hidden" name="filter" value="<?= esc($filter) ?>">
                    <label class="toolbar-search">
                        <?= icon('search', 16) ?>
                        <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nama atau nomor HP pelanggan...">
                    </label>
                </form>

                <div class="toolbar-chips">
                    <?php foreach ($filterList as $kunci => $label): ?>
                        <a class="chip <?= $filter === $kunci ? 'active' : '' ?>" href="<?= site_url('kasir/pelanggan' . $qs(['filter' => $kunci, 'pilih' => null])) ?>">
                            <?= esc($label) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="table-wrap">
                <table class="tt">
                    <thead>
                        <tr>
                            <th>NAMA PELANGGAN</th>
                            <th>NOMOR HP</th>
                            <th>RESEP</th>
                            <th>PO AKTIF</th>
                            <th class="tt-right">AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rows as $c): ?>
                            <?php $url = site_url('kasir/pelanggan' . $qs(['pilih' => (int) $c['id_pelanggan'], 'tambah' => null, 'ubah' => null])); ?>
                            <tr class="<?= (int) ($terpilih['id_pelanggan'] ?? 0) === (int) $c['id_pelanggan'] ? 'is-active' : '' ?>"
                                style="cursor:pointer" onclick="window.location='<?= $url ?>'">
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
                                <td><?= status_text((int) $c['jml_resep'] > 0 ? 'Ada' : 'Belum ada') ?></td>
                                <td>
                                    <span class="tt-sub" style="margin-top:0">
                                        <?= (int) $c['po_aktif'] > 0 ? (int) $c['po_aktif'] . ' pesanan' : 'Tidak ada' ?>
                                    </span>
                                </td>
                                <td class="tt-right">
                                    <a class="link-action" href="<?= $url ?>">
                                        Detail
                                        <?= icon('chevron-right', 15) ?>
                                    </a>
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

        <aside class="detail-panel">
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
</div>

<?php if ($drawer): ?>
    <div class="overlay">
        <div class="drawer" role="dialog" aria-modal="true">
            <div class="drawer-head">
                <div>
                    <h2><?= $ubah ? 'Edit Pelanggan' : 'Tambah Pelanggan' ?></h2>
                    <div class="section-desc">Data pelanggan tersimpan untuk cabang ini.</div>
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
                    <input name="nama_pelanggan" required minlength="2" value="<?= $ubah ? esc($terpilih['nama_pelanggan']) : '' ?>" placeholder="cth. Andi Saputra">
                </label>

                <label class="afield">
                    <span>Nomor HP</span>
                    <input name="no_hp" value="<?= $ubah ? esc($terpilih['no_hp'] ?? '') : '' ?>" placeholder="cth. 0812 3456 7890">
                </label>

                <label class="afield">
                    <span>Alamat</span>
                    <input name="alamat" value="<?= $ubah ? esc($terpilih['alamat'] ?? '') : '' ?>" placeholder="cth. Jl. Khatib Sulaiman No. 12">
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
