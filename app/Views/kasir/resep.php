<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static fn (array $ubah): string => '?' . http_build_query(array_merge([
    'q'      => $cariQ,
    'filter' => $filter,
    'pilih'  => $terpilih['id_resep'] ?? null,
], $ubah));

$filterList = ['semua' => 'Semua', 'aktif' => 'Aktif', 'expired' => 'Expired'];
$tambah     = request()->getGet('tambah') === '1';
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs"><b>Kasir</b> › Resep Mata</div>
        <div class="pagehead-main">
            <div>
                <div class="overline">ARSIP RESEP</div>
                <h1>Resep Mata</h1>
                <p>Arsip resep pelanggan untuk mempercepat pembuatan lensa.</p>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-primary" href="<?= site_url('kasir/resep' . $qs(['tambah' => 1])) ?>">
                    <?= icon('plus', 16) ?>
                    Tambah Resep
                </a>
            </div>
        </div>
    </div>

    <div class="stat-row">
        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Total resep</div>
                <div class="stat-value"><?= (int) $total ?></div>
                <div class="stat-caption">Tersimpan di cabang ini</div>
            </div>
            <span class="stat-icon"><?= icon('glasses', 22) ?></span>
        </div>
        <div class="stat-card tone-green">
            <div class="stat-body">
                <div class="stat-label">Resep aktif</div>
                <div class="stat-value"><?= (int) $aktifCount ?></div>
                <div class="stat-caption">Masih dapat digunakan</div>
            </div>
            <span class="stat-icon"><?= icon('calendar-days', 22) ?></span>
        </div>
        <div class="stat-card tone-amber">
            <div class="stat-body">
                <div class="stat-label">Perlu diperbarui</div>
                <div class="stat-value"><?= (int) $expired ?></div>
                <div class="stat-caption">Resep sudah kedaluwarsa</div>
            </div>
            <span class="stat-icon"><?= icon('circle-dot', 22) ?></span>
        </div>
    </div>

    <div class="split">
        <section class="section-block">
            <div class="section-head">
                <div>
                    <h2>Daftar Resep</h2>
                    <div class="section-desc">Resep terbaru per pelanggan</div>
                </div>
            </div>

            <div class="toolbar">
                <form method="get" action="<?= site_url('kasir/resep') ?>">
                    <input type="hidden" name="filter" value="<?= esc($filter) ?>">
                    <label class="toolbar-search">
                        <?= icon('search', 16) ?>
                        <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nama pelanggan atau kode resep...">
                    </label>
                </form>

                <div class="toolbar-chips">
                    <?php foreach ($filterList as $kunci => $label): ?>
                        <a class="chip <?= $filter === $kunci ? 'active' : '' ?>" href="<?= site_url('kasir/resep' . $qs(['filter' => $kunci, 'pilih' => null, 'tambah' => null])) ?>">
                            <?= esc($label) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="table-wrap">
                <table class="tt">
                    <thead>
                        <tr>
                            <th>PELANGGAN</th>
                            <th>TANGGAL</th>
                            <th>OD (KANAN)</th>
                            <th>OS (KIRI)</th>
                            <th>PD</th>
                            <th>STATUS</th>
                            <th class="tt-right">AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rows as $r): ?>
                            <?php $url = site_url('kasir/resep' . $qs(['pilih' => (int) $r['id_resep'], 'tambah' => null])); ?>
                            <tr class="<?= (int) ($terpilih['id_resep'] ?? 0) === (int) $r['id_resep'] ? 'is-active' : '' ?>"
                                style="cursor:pointer" onclick="window.location='<?= $url ?>'">
                                <td>
                                    <div class="cell-person">
                                        <?= avatar($r['nama_pelanggan'], 40) ?>
                                        <span>
                                            <b><?= esc($r['nama_pelanggan']) ?></b>
                                            <span><?= esc($r['kode_resep']) ?></span>
                                        </span>
                                    </div>
                                </td>
                                <td><?= esc(tgl_id($r['tanggal_resep'])) ?></td>
                                <td>
                                    <div class="tt-num" style="font-size:13px">SPH <?= esc($r['od_sph'] ?? '-') ?></div>
                                    <div class="tt-sub">CYL <?= esc($r['od_cyl'] ?? '-') ?> · AX <?= esc($r['od_axis'] ?? '-') ?></div>
                                </td>
                                <td>
                                    <div class="tt-num" style="font-size:13px">SPH <?= esc($r['os_sph'] ?? '-') ?></div>
                                    <div class="tt-sub">CYL <?= esc($r['os_cyl'] ?? '-') ?> · AX <?= esc($r['os_axis'] ?? '-') ?></div>
                                </td>
                                <td><?= esc($r['pd'] ?? '-') ?></td>
                                <td><?= status_pill($r['status']) ?></td>
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
                                <td colspan="7"><div class="empty-note">Resep tidak ditemukan.</div></td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
                <div class="table-foot">
                    <span class="foot-note">Menampilkan <?= count($rows) ?> dari <?= (int) $total ?> resep</span>
                </div>
            </div>
        </section>

        <aside class="detail-panel">
            <?php if ($terpilih !== null): ?>
                <div class="detail-head">
                    <?= avatar($terpilih['nama_pelanggan'], 48) ?>
                    <div>
                        <b><?= esc($terpilih['nama_pelanggan']) ?></b>
                        <span><?= esc($terpilih['kode_resep']) ?></span>
                    </div>
                </div>

                <div class="detail-badges"><?= status_pill($terpilih['status']) ?></div>

                <div class="detail-rows">
                    <div class="detail-row">
                        <span>Tanggal periksa</span>
                        <b><?= esc(tgl_id($terpilih['tanggal_resep'])) ?></b>
                    </div>
                    <div class="detail-row">
                        <span>PD</span>
                        <b><?= esc($terpilih['pd'] ?? '-') ?></b>
                    </div>
                    <div class="detail-row">
                        <span>ADD</span>
                        <b><?= esc($terpilih['add_power'] ?? '-') ?></b>
                    </div>
                </div>

                <div class="mini-label">RESEP MATA</div>
                <div class="rx-mini">
                    <div class="rx-eye">
                        <div class="ey-label">OD / KANAN</div>
                        <b><?= esc($terpilih['od_sph'] ?? '-') ?></b>
                        <span>CYL <?= esc($terpilih['od_cyl'] ?? '-') ?> · AXIS <?= esc($terpilih['od_axis'] ?? '-') ?></span>
                    </div>
                    <div class="rx-eye">
                        <div class="ey-label">OS / KIRI</div>
                        <b><?= esc($terpilih['os_sph'] ?? '-') ?></b>
                        <span>CYL <?= esc($terpilih['os_cyl'] ?? '-') ?> · AXIS <?= esc($terpilih['os_axis'] ?? '-') ?></span>
                    </div>
                </div>

                <?php if (! empty($terpilih['catatan'])): ?>
                    <div class="tt-sub" style="font-weight:600"><?= esc($terpilih['catatan']) ?></div>
                <?php endif; ?>

                <button class="btn btn-primary full" type="button" onclick="window.print()">
                    <?= icon('printer', 16) ?>
                    Cetak Resep
                </button>
            <?php else: ?>
                <div class="empty-note">Pilih resep untuk melihat detail.</div>
            <?php endif; ?>
        </aside>
    </div>
</div>

<?php if ($tambah): ?>
    <div class="overlay">
        <div class="drawer" role="dialog" aria-modal="true">
            <div class="drawer-head">
                <div>
                    <h2>Tambah Resep</h2>
                    <div class="section-desc">Simpan ukuran lensa pelanggan untuk transaksi berikutnya.</div>
                </div>
                <a class="icon-pill" aria-label="Tutup" href="<?= site_url('kasir/resep') ?>">
                    <?= icon('x', 18) ?>
                </a>
            </div>

            <form class="drawer-form" method="post" action="<?= site_url('kasir/resep') ?>">
                <?= csrf_field() ?>

                <label class="afield">
                    <span>Pelanggan</span>
                    <select name="pelanggan_id" required>
                        <?php foreach ($pelanggan as $c): ?>
                            <option value="<?= (int) $c['id_pelanggan'] ?>">
                                <?= esc($c['nama_pelanggan']) ?> · PLG-<?= str_pad((string) $c['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </label>

                <label class="afield">
                    <span>Tanggal periksa</span>
                    <input type="date" name="tanggal_resep" value="<?= date('Y-m-d') ?>" required>
                </label>

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
                    <?php foreach (['od_sph' => 'OD SPH', 'od_cyl' => 'OD CYL', 'od_axis' => 'OD AXIS', 'os_sph' => 'OS SPH', 'os_cyl' => 'OS CYL', 'os_axis' => 'OS AXIS'] as $field => $label): ?>
                        <label class="afield">
                            <span><?= esc($label) ?></span>
                            <input name="<?= esc($field) ?>" placeholder="-0.00">
                        </label>
                    <?php endforeach; ?>
                </div>

                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
                    <label class="afield">
                        <span>PD</span>
                        <input name="pd" placeholder="cth. 32.0">
                    </label>
                    <label class="afield">
                        <span>ADD</span>
                        <input name="add_power" placeholder="cth. +1.00">
                    </label>
                </div>

                <label class="afield">
                    <span>Catatan (opsional)</span>
                    <input name="catatan" placeholder="cth. resep dari dokter mata">
                </label>

                <div class="drawer-foot">
                    <a class="btn btn-ghost" href="<?= site_url('kasir/resep') ?>">Batal</a>
                    <button type="submit" class="btn btn-primary">Simpan Resep</button>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>
<?= $this->endSection() ?>
