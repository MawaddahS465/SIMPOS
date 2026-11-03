<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$dasar = [
    'q'      => $cariQ,
    'filter' => $filter,
    'pilih'  => $terpilih['id_resep'] ?? null,
];
$qs = static fn (array $ubah): string => '?' . http_build_query(array_merge($dasar, $ubah));

$tutupUrl = site_url('kasir/resep' . $qs(['pilih' => null, 'tambah' => null]));
$tambah   = request()->getGet('tambah') === '1';

$nilai = static fn ($v): string => ($v === null || trim((string) $v) === '') ? '-' : (string) $v;
$cyl   = static fn ($v): string => ($v === null || trim((string) $v) === '') ? '0.00' : (string) $v;

$filterList = ['semua' => 'Semua Resep', 'terbaru' => 'Resep Terbaru'];
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <div class="overline">ARSIP RESEP</div>
                <h1>Resep Mata</h1>
                <p>Catat dan kelola riwayat resep ukuran lensa mata kanan (OD) dan kiri (OS) pelanggan.</p>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-primary" href="<?= esc(site_url('kasir/resep' . $qs(['tambah' => 1, 'pilih' => null])), 'attr') ?>">
                    <?= icon('plus', 16) ?>
                    Tambah Resep
                </a>
            </div>
        </div>
    </div>

    <div class="stat-row">
        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Total arsip resep</div>
                <div class="stat-value"><?= (int) $total ?></div>
                <div class="stat-caption">Tersimpan di cabang ini</div>
            </div>
            <span class="stat-icon"><?= icon('glasses', 22) ?></span>
        </div>
        <div class="stat-card tone-green">
            <div class="stat-body">
                <div class="stat-label">Pelanggan memiliki resep</div>
                <div class="stat-value"><?= (int) $unik ?></div>
                <div class="stat-caption">Tercatat dalam arsip digital</div>
            </div>
            <span class="stat-icon"><?= icon('users', 22) ?></span>
        </div>
        <div class="stat-card tone-blue">
            <div class="stat-body">
                <div class="stat-label">Pemeriksaan terbaru</div>
                <div class="stat-value"><?= esc($terbaru !== null ? tgl_id($terbaru['tanggal_resep']) : '-') ?></div>
                <div class="stat-caption">
                    <?= $terbaru !== null
                        ? esc($terbaru['nama_pelanggan'] . ' (' . $terbaru['kode_resep'] . ')')
                        : 'Belum ada data' ?>
                </div>
            </div>
            <span class="stat-icon"><?= icon('calendar-days', 22) ?></span>
        </div>
    </div>

    <section class="section-block">
        <div class="section-head">
            <div>
                <h2>Daftar Resep</h2>
                <div class="section-desc">Cari riwayat resep berdasarkan nama atau nomor HP pelanggan</div>
            </div>
        </div>

        <form class="toolbar" method="get" action="<?= esc(site_url('kasir/resep'), 'attr') ?>">
            <label class="toolbar-search">
                <?= icon('search', 16) ?>
                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nama pelanggan, nomor HP, atau kode resep...">
            </label>
            <div class="toolbar-chips">
                <select class="chip-select" name="filter" aria-label="Filter Resep" onchange="this.form.submit()">
                    <?php foreach ($filterList as $kunci => $label): ?>
                        <option value="<?= esc($kunci, 'attr') ?>" <?= $filter === $kunci ? 'selected' : '' ?>>
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
                        <th>TANGGAL</th>
                        <th>PELANGGAN</th>
                        <th>OD (KANAN)</th>
                        <th>OS (KIRI)</th>
                        <th>KETERANGAN</th>
                        <th class="tt-right">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rows as $r): ?>
                        <?php
                        $detailUrl = site_url('kasir/resep' . $qs(['pilih' => (int) $r['id_resep'], 'tambah' => null]));
                        $aktifBaris = (int) ($terpilih['id_resep'] ?? 0) === (int) $r['id_resep'];
                        ?>
                        <tr class="<?= $aktifBaris ? 'is-active' : '' ?>"
                            style="cursor:pointer"
                            onclick="window.location='<?= esc($detailUrl, 'attr') ?>'">
                            <td>
                                <div class="tt-num"><?= esc(tgl_id($r['tanggal_resep'])) ?></div>
                                <div class="tt-sub"><?= esc($r['kode_resep']) ?></div>
                            </td>
                            <td>
                                <div class="cell-person">
                                    <?= avatar($r['nama_pelanggan'], 40) ?>
                                    <span>
                                        <b><?= esc($r['nama_pelanggan']) ?></b>
                                        <span><?= esc($r['no_hp'] ?: $r['kode_resep']) ?></span>
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="tt-num" style="font-size:13px">SPH <?= esc($nilai($r['od_sph'])) ?></div>
                                <div class="tt-sub">CYL <?= esc($cyl($r['od_cyl'])) ?> · AX <?= esc($nilai($r['od_axis'])) ?></div>
                            </td>
                            <td>
                                <div class="tt-num" style="font-size:13px">SPH <?= esc($nilai($r['os_sph'])) ?></div>
                                <div class="tt-sub">CYL <?= esc($cyl($r['os_cyl'])) ?> · AX <?= esc($nilai($r['os_axis'])) ?></div>
                            </td>
                            <td>
                                <div style="font-size:13px;font-weight:600;color:var(--ink-2)">
                                    <?= esc(! empty($r['catatan']) ? $r['catatan'] : 'Pemeriksaan ukuran lensa') ?>
                                </div>
                                <div class="tt-sub">PD <?= esc($nilai($r['pd'])) ?> mm · ADD <?= esc($nilai($r['add_power'])) ?></div>
                            </td>
                            <td class="tt-right">
                                <a class="link-action" href="<?= esc($detailUrl, 'attr') ?>" onclick="event.stopPropagation()">
                                    Lihat Detail
                                    <?= icon('chevron-right', 15) ?>
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if ($rows === []): ?>
                        <tr>
                            <td colspan="6"><div class="empty-note">Resep tidak ditemukan.</div></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            <div class="table-foot">
                <span class="foot-note">Menampilkan <?= count($rows) ?> dari <?= (int) $total ?> resep</span>
            </div>
        </div>
    </section>

    <?php if ($terpilih !== null): ?>
        <div class="overlay" id="detail-resep"
             onclick="if (event.target === this) { window.location = '<?= esc($tutupUrl, 'attr') ?>'; }">
            <div class="drawer" role="dialog" aria-modal="true">
                <div class="drawer-head">
                    <div class="detail-head">
                        <?= avatar($terpilih['nama_pelanggan'], 48) ?>
                        <div>
                            <b><?= esc($terpilih['nama_pelanggan']) ?></b>
                            <span>
                                <?= esc($terpilih['kode_resep']) ?><?= ! empty($terpilih['no_hp']) ? ' · ' . esc($terpilih['no_hp']) : '' ?>
                            </span>
                        </div>
                    </div>
                    <a class="icon-pill" aria-label="Tutup" href="<?= esc($tutupUrl, 'attr') ?>">
                        <?= icon('x', 18) ?>
                    </a>
                </div>

                <div>
                    <div class="mini-label" style="color:var(--accent-ink)">UKURAN LENSA (OD &amp; OS)</div>
                    <div class="rx-mini" style="margin-top:10px">
                        <div class="rx-eye">
                            <div class="ey-label">OD / MATA KANAN</div>
                            <b><?= esc($nilai($terpilih['od_sph'])) ?></b>
                            <span>CYL <?= esc($cyl($terpilih['od_cyl'])) ?> · AXIS <?= esc($nilai($terpilih['od_axis'])) ?></span>
                        </div>
                        <div class="rx-eye">
                            <div class="ey-label">OS / MATA KIRI</div>
                            <b><?= esc($nilai($terpilih['os_sph'])) ?></b>
                            <span>CYL <?= esc($cyl($terpilih['os_cyl'])) ?> · AXIS <?= esc($nilai($terpilih['os_axis'])) ?></span>
                        </div>
                    </div>
                </div>

                <div class="detail-rows">
                    <div class="detail-row">
                        <span>PD (Pupillary Distance)</span>
                        <b><?= esc($nilai($terpilih['pd'])) ?> mm</b>
                    </div>
                    <div class="detail-row">
                        <span>ADD (Baca)</span>
                        <b><?= esc($nilai($terpilih['add_power'])) ?></b>
                    </div>
                    <div class="detail-row">
                        <span>Tanggal Resep</span>
                        <b><?= esc(tgl_id($terpilih['tanggal_resep'])) ?></b>
                    </div>
                    <div class="detail-row">
                        <span>Keterangan / Catatan</span>
                        <b><?= esc($nilai($terpilih['catatan'])) ?></b>
                    </div>
                </div>

                <div class="drawer-foot">
                    <a class="btn btn-ghost" href="<?= esc($tutupUrl, 'attr') ?>">Tutup</a>
                    <button type="button" class="btn btn-primary" id="cetak-resep">
                        <?= icon('printer', 16) ?>
                        Cetak Resep
                    </button>
                </div>
            </div>
        </div>

        <div class="overlay" id="print-resep" style="display:none">
            <div class="drawer struk-drawer" role="dialog" aria-modal="true">
                <div class="drawer-head">
                    <div>
                        <h2>Kartu Resep Mata</h2>
                        <div class="section-desc"><?= esc($terpilih['kode_resep']) ?> · <?= esc($terpilih['nama_pelanggan']) ?></div>
                    </div>
                    <button type="button" class="icon-pill" aria-label="Tutup" id="tutup-print">
                        <?= icon('x', 18) ?>
                    </button>
                </div>

                <div class="struk-print" id="struk-print">
                    <div class="struk-brand">
                        <div class="struk-logo">
                            <img src="<?= esc(base_url('assets/logo-mk.png'), 'attr') ?>" width="44" height="44" alt="Logo Optik Mekar Jaya">
                        </div>
                        <b>Optik Mekar Jaya</b>
                        <span><?= esc(current_branch_name()) ?></span>
                    </div>

                    <div class="struk-meta">
                        <div>
                            <span>No. Resep</span>
                            <b><?= esc($terpilih['kode_resep']) ?></b>
                        </div>
                        <div>
                            <span>Tanggal Resep</span>
                            <b><?= esc(tgl_id($terpilih['tanggal_resep'])) ?></b>
                        </div>
                        <div>
                            <span>Pelanggan</span>
                            <b><?= esc($terpilih['nama_pelanggan']) ?></b>
                        </div>
                        <?php if (! empty($terpilih['no_hp'])): ?>
                            <div>
                                <span>No. HP</span>
                                <b><?= esc($terpilih['no_hp']) ?></b>
                            </div>
                        <?php endif; ?>
                        <div>
                            <span>Kasir</span>
                            <b><?= esc((string) (session()->get('nama') ?? 'Kasir')) ?></b>
                        </div>
                    </div>

                    <div class="struk-items">
                        <div class="struk-line">
                            <span>
                                <b>OD (Mata Kanan)</b>
                                <small>SPH <?= esc($nilai($terpilih['od_sph'])) ?> · CYL <?= esc($cyl($terpilih['od_cyl'])) ?> · AXIS <?= esc($nilai($terpilih['od_axis'])) ?></small>
                            </span>
                            <b>SPH <?= esc($nilai($terpilih['od_sph'])) ?></b>
                        </div>
                        <div class="struk-line">
                            <span>
                                <b>OS (Mata Kiri)</b>
                                <small>SPH <?= esc($nilai($terpilih['os_sph'])) ?> · CYL <?= esc($cyl($terpilih['os_cyl'])) ?> · AXIS <?= esc($nilai($terpilih['os_axis'])) ?></small>
                            </span>
                            <b>SPH <?= esc($nilai($terpilih['os_sph'])) ?></b>
                        </div>
                    </div>

                    <div class="struk-totals">
                        <div>
                            <span>PD (Pupillary Distance)</span>
                            <b><?= esc($nilai($terpilih['pd'])) ?> mm</b>
                        </div>
                        <div>
                            <span>ADD (Baca / Dekat)</span>
                            <b><?= esc($nilai($terpilih['add_power'])) ?></b>
                        </div>
                        <div>
                            <span>Catatan</span>
                            <b><?= esc($nilai($terpilih['catatan'])) ?></b>
                        </div>
                    </div>

                    <div class="struk-foot">
                        <span>Arsip Resep Digital · Optik Mekar Jaya</span>
                        <span>Simpan kartu ini untuk kemudahan pemesanan lensa</span>
                    </div>
                </div>

                <div class="drawer-foot">
                    <button type="button" class="btn btn-ghost" id="batal-print">Tutup</button>
                    <button type="button" class="btn btn-primary" id="proses-print">
                        <?= icon('printer', 16) ?>
                        Cetak Sekarang
                    </button>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <?php if ($tambah): ?>
        <div class="overlay po-modal-overlay">
            <div class="drawer simple-modal" role="dialog" aria-modal="true">
                <div class="simple-modal-head">
                    <div class="smh-left">
                        <div class="smh-ico">
                            <?= icon('glasses', 20) ?>
                        </div>
                        <div>
                            <h2>Tambah Resep Mata</h2>
                            <p>Catat hasil pemeriksaan ukuran mata kanan (OD) &amp; kiri (OS)</p>
                        </div>
                    </div>
                    <a class="icon-pill" aria-label="Tutup" href="<?= esc($tutupUrl, 'attr') ?>">
                        <?= icon('x', 18) ?>
                    </a>
                </div>

                <form class="drawer-form simple-modal-form" method="post" action="<?= esc(site_url('kasir/resep'), 'attr') ?>">
                    <?= csrf_field() ?>

                    <div class="simple-two-col">
                        <label class="afield">
                            <span>Pelanggan *</span>
                            <select name="pelanggan_id" required>
                                <?php foreach ($pelanggan as $c): ?>
                                    <option value="<?= (int) $c['id_pelanggan'] ?>">
                                        <?= esc($c['nama_pelanggan']) ?> · <?= esc($c['no_hp'] ?? '-') ?> (PLG-<?= str_pad((string) $c['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </label>

                        <label class="afield">
                            <span>Tanggal Pemeriksaan</span>
                            <input type="date" name="tanggal_resep" value="<?= date('Y-m-d') ?>" required>
                        </label>
                    </div>

                    <div class="simple-rx-box">
                        <div class="srb-title">OD — Mata Kanan</div>
                        <div class="srb-grid">
                            <label class="afield">
                                <span>SPH *</span>
                                <input name="od_sph" placeholder="-1.50" required>
                            </label>
                            <label class="afield">
                                <span>CYL</span>
                                <input name="od_cyl" placeholder="-0.75">
                            </label>
                            <label class="afield">
                                <span>AXIS</span>
                                <input name="od_axis" placeholder="180">
                            </label>
                        </div>
                    </div>

                    <div class="simple-rx-box">
                        <div class="srb-title">OS — Mata Kiri</div>
                        <div class="srb-grid">
                            <label class="afield">
                                <span>SPH *</span>
                                <input name="os_sph" placeholder="-1.25" required>
                            </label>
                            <label class="afield">
                                <span>CYL</span>
                                <input name="os_cyl" placeholder="-0.50">
                            </label>
                            <label class="afield">
                                <span>AXIS</span>
                                <input name="os_axis" placeholder="170">
                            </label>
                        </div>
                    </div>

                    <div class="simple-two-col">
                        <label class="afield">
                            <span>PD (mm) *</span>
                            <input name="pd" placeholder="cth. 62" required>
                        </label>
                        <label class="afield">
                            <span>ADD (opsional)</span>
                            <input name="add_power" placeholder="cth. +1.00">
                        </label>
                    </div>

                    <label class="afield">
                        <span>Keterangan / Catatan (opsional)</span>
                        <input name="catatan" placeholder="cth. Resep dokter mata / lensa blue control">
                    </label>

                    <div class="drawer-foot">
                        <a class="btn btn-ghost" href="<?= esc($tutupUrl, 'attr') ?>">Batal</a>
                        <button type="submit" class="btn btn-primary">
                            <?= icon('file-text', 15) ?>
                            Simpan Resep
                        </button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>

    <script>
        (function () {
            var overlayPrint = document.getElementById('print-resep');
            var tombolCetak  = document.getElementById('cetak-resep');
            var batalPrint   = document.getElementById('batal-print');
            var tutupPrint   = document.getElementById('tutup-print');
            var prosesPrint  = document.getElementById('proses-print');

            if (!overlayPrint || !tombolCetak) {
                return;
            }

            tombolCetak.addEventListener('click', function () {
                overlayPrint.style.display = '';
            });

            function tutup() {
                overlayPrint.style.display = 'none';
            }

            batalPrint.addEventListener('click', tutup);
            tutupPrint.addEventListener('click', tutup);
            overlayPrint.addEventListener('click', function (e) {
                if (e.target === overlayPrint) {
                    tutup();
                }
            });
            prosesPrint.addEventListener('click', function () {
                window.print();
            });
        })();
    </script>
</div>
<?= $this->endSection() ?>
