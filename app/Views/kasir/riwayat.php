<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static function (array $ubah = []) use ($status, $metode, $cariQ, $periode, $dari, $sampai, $buka): string {
    $params = array_merge([
        'status'  => $status,
        'metode'  => $metode,
        'q'       => $cariQ,
        'periode' => $periode,
        'dari'    => $dari,
        'sampai'  => $sampai,
        'buka'    => $buka > 0 ? $buka : null,
    ], $ubah);

    $params = array_filter($params, static fn ($v): bool => $v !== null && $v !== '');

    return $params === [] ? '' : '?' . http_build_query($params);
};

$periodeList = [
    'semua'    => 'Semua Periode (01 Agu - 31 Okt 2026)',
    'hari'     => 'Hari Ini',
    'mingguan' => 'Minggu Ini',
    'bulanan'  => 'Bulan Ini',
    'okt-2026' => 'Oktober 2026',
    'sep-2026' => 'September 2026',
    'agu-2026' => 'Agustus 2026',
    'custom'   => 'Pilih Rentang Tanggal...',
];

$metodeList = [
    ''              => 'Semua Metode',
    'Tunai'         => 'Tunai',
    'QRIS'          => 'QRIS',
    'Transfer Bank' => 'Transfer Bank',
    'Kartu'         => 'Kartu',
];

$statusList = [
    ''           => 'Semua Status',
    'selesai'    => 'Selesai',
    'pending'    => 'Pending',
    'dibatalkan' => 'Dibatalkan',
];

$metodeIkonMap = [
    'Tunai'              => 'banknote',
    'QRIS'               => 'qr-code',
    'Transfer Bank'      => 'wallet',
    'Kartu Debit/Kredit' => 'credit-card',
];
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <div class="overline">TRANSAKSI &amp; PEMBAYARAN CABANG</div>
                <h1>Riwayat Transaksi</h1>
                <p>Lihat riwayat transaksi yang telah lunas, metode pembayaran, cetak struk, dan ekspor laporan cabang</p>
            </div>
            <div class="pagehead-actions">
                <form class="period-pill-select" method="get" action="<?= site_url('kasir/riwayat') ?>" title="Pilih periode tanggal transaksi">
                    <input type="hidden" name="status" value="<?= esc($status) ?>">
                    <input type="hidden" name="metode" value="<?= esc($metode) ?>">
                    <input type="hidden" name="q" value="<?= esc($cariQ) ?>">
                    <input type="hidden" name="dari" value="<?= esc($dari) ?>">
                    <input type="hidden" name="sampai" value="<?= esc($sampai) ?>">
                    <?= icon('calendar-days', 15) ?>
                    <select name="periode" aria-label="Periode Tanggal Transaksi" style="appearance:none" onchange="this.form.submit()">
                        <?php foreach ($periodeList as $nilai => $label): ?>
                            <option value="<?= esc($nilai) ?>" <?= $periode === $nilai ? 'selected' : '' ?>><?= esc($label) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <?= icon('chevron-down', 14) ?>
                </form>
                <a class="btn btn-primary" href="<?= site_url('kasir/riwayat' . $qs(['ekspor' => '1', 'buka' => null])) ?>">
                    <?= icon('download', 16) ?>
                    Ekspor XLSX
                </a>
            </div>
        </div>
    </div>

    <?php if ($periode === 'custom'): ?>
        <div class="custom-date-bar">
            <div class="cdb-title">
                <?= icon('calendar-days', 16) ?>
                <span>Filter Rentang Tanggal Kustom:</span>
            </div>
            <form class="cdb-inputs" method="get" action="<?= site_url('kasir/riwayat') ?>">
                <input type="hidden" name="status" value="<?= esc($status) ?>">
                <input type="hidden" name="metode" value="<?= esc($metode) ?>">
                <input type="hidden" name="q" value="<?= esc($cariQ) ?>">
                <input type="hidden" name="periode" value="custom">
                <label class="cdb-field">
                    <span>Dari</span>
                    <input type="date" name="dari" value="<?= esc($dari) ?>" onchange="this.form.submit()">
                </label>
                <span class="cdb-sep">—</span>
                <label class="cdb-field">
                    <span>Sampai</span>
                    <input type="date" name="sampai" value="<?= esc($sampai) ?>" onchange="this.form.submit()">
                </label>
                <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/riwayat' . $qs(['periode' => 'semua', 'dari' => null, 'sampai' => null, 'buka' => null])) ?>">
                    Reset Periode
                </a>
            </form>
        </div>
    <?php endif; ?>

    <div class="stat-row">
        <div class="stat-card tone-green">
            <div class="stat-body">
                <div class="stat-label">Total diterima (Lunas)</div>
                <div class="stat-value"><?= esc(rupiah($diterima)) ?></div>
                <div class="stat-caption"><?= esc('Tunai ' . rupiah($tunai) . ' · Non-tunai ' . rupiah($nonTunai)) ?></div>
            </div>
            <span class="stat-icon"><?= icon('banknote', 22) ?></span>
        </div>

        <div class="stat-card tone-blue">
            <div class="stat-body">
                <div class="stat-label">Transaksi selesai</div>
                <div class="stat-value"><?= (int) $selesaiCount ?></div>
                <div class="stat-caption">Transaksi telah dibayar lunas</div>
            </div>
            <span class="stat-icon"><?= icon('wallet', 22) ?></span>
        </div>

        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Jumlah ditampilkan</div>
                <div class="stat-value"><?= (int) $jumlah ?></div>
                <div class="stat-caption">Dari <?= (int) $total ?> total riwayat transaksi</div>
            </div>
            <span class="stat-icon"><?= icon('credit-card', 22) ?></span>
        </div>
    </div>

    <section class="section-block">
        <div class="section-head">
            <div>
                <h2>Daftar Transaksi</h2>
                <div class="section-desc">Pilih transaksi untuk melihat detail pembayaran dan struk</div>
            </div>
            <div class="section-action">
                <span class="foot-note" style="color:var(--muted);font-size:12.5px;font-weight:700"><?= (int) $jumlah ?> transaksi</span>
            </div>
        </div>

        <form class="toolbar" method="get" action="<?= site_url('kasir/riwayat') ?>">
            <input type="hidden" name="periode" value="<?= esc($periode) ?>">
            <input type="hidden" name="dari" value="<?= esc($dari) ?>">
            <input type="hidden" name="sampai" value="<?= esc($sampai) ?>">

            <label class="toolbar-search">
                <?= icon('search', 16) ?>
                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nomor transaksi, nama pelanggan, telepon, atau metode..." aria-label="Cari transaksi">
            </label>

            <div class="toolbar-chips" style="align-items:center">
                <select class="chip-select" name="metode" aria-label="Filter Metode Pembayaran" onchange="this.form.submit()">
                    <?php foreach ($metodeList as $nilai => $label): ?>
                        <option value="<?= esc($nilai) ?>" <?= $metode === $nilai ? 'selected' : '' ?>><?= esc($label) ?></option>
                    <?php endforeach; ?>
                </select>

                <select class="chip-select" name="status" aria-label="Filter Status Transaksi" onchange="this.form.submit()">
                    <?php foreach ($statusList as $nilai => $label): ?>
                        <option value="<?= esc($nilai) ?>" <?= $status === $nilai ? 'selected' : '' ?>><?= esc($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </form>

        <div class="table-wrap">
            <table class="tt">
                <thead>
                    <tr>
                        <th>NO. TRANSAKSI</th>
                        <th>PELANGGAN</th>
                        <th>METODE</th>
                        <th class="tt-right">TOTAL</th>
                        <th class="tt-center">STATUS</th>
                        <th class="tt-right">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rows as $t): ?>
                        <?php
                        $id        = (int) $t['id_transaksi'];
                        $terbuka   = $buka === $id;
                        $metodeRow = (string) ($t['metode_pembayaran'] ?? 'Tunai');

                        if ($metodeRow === '') {
                            $metodeRow = 'Tunai';
                        }

                        $metodeShort = $metodeRow === 'Kartu Debit/Kredit' ? 'Kartu' : $metodeRow;
                        $metodeIkon  = $metodeIkonMap[$metodeRow] ?? 'wallet';
                        $waktu       = strtotime((string) ($t['tanggal_transaksi'] ?? ''));
                        $jam         = $waktu !== false ? date('H:i', $waktu) : '-';
                        $rowUrl      = site_url('kasir/riwayat' . $qs(['buka' => $terbuka ? null : $id]));
                        ?>
                        <tr class="<?= $terbuka ? 'is-active' : '' ?>" style="cursor:pointer" onclick="window.location.href='<?= esc($rowUrl) ?>'">
                            <td>
                                <div class="tt-num"><?= esc($t['kode_transaksi'] ?? '-') ?></div>
                                <div class="tt-sub"><?= esc(tgl_id($t['tanggal_transaksi'] ?? null)) ?> · <?= esc($jam) ?></div>
                            </td>
                            <td>
                                <div class="cell-person">
                                    <?= avatar($t['nama_pelanggan'] ?? '-', 34) ?>
                                    <span>
                                        <b><?= esc($t['nama_pelanggan'] ?? '-') ?></b>
                                        <span><?= esc($t['no_hp'] ?? '-') ?></span>
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span class="type-chip">
                                    <?= icon($metodeIkon, 14) ?>
                                    <?= esc($metodeShort) ?>
                                </span>
                            </td>
                            <td class="tt-right tt-money"><?= esc(rupiah($t['total'] ?? 0)) ?></td>
                            <td class="tt-center"><?= status_pill($t['status'] ?? '') ?></td>
                            <td class="tt-right">
                                <a class="link-action" href="<?= esc($rowUrl) ?>" onclick="event.stopPropagation()">
                                    Lihat Detail
                                    <?= icon('chevron-right', 15) ?>
                                </a>
                            </td>
                        </tr>

                        <?php if ($terbuka): ?>
                            <?php
                            $items     = $detailMap[$id] ?? [];
                            $subtotal  = (float) ($t['total'] ?? 0) + (float) ($t['diskon'] ?? 0);
                            $dibayar   = $metodeRow === 'Tunai'
                                ? (float) ($t['jumlah_bayar'] ?? $t['total'] ?? 0)
                                : (float) ($t['total'] ?? 0);
                            $kembalian = $metodeRow === 'Tunai' ? max(0, $dibayar - (float) ($t['total'] ?? 0)) : 0.0;
                            ?>
                            <tr>
                                <td colspan="6" style="padding:8px 10px 14px">
                                    <div class="riwayat-detail" style="max-height:none;overflow:visible">
                                        <div class="detail-head">
                                            <?= avatar($t['nama_pelanggan'] ?? '-', 48) ?>
                                            <div>
                                                <b><?= esc($t['nama_pelanggan'] ?? '-') ?></b>
                                                <span><?= esc($t['kode_transaksi'] ?? '-') ?> · <?= esc($jam) ?> WIB</span>
                                            </div>
                                        </div>

                                        <div class="detail-badges">
                                            <?= status_pill($t['status'] ?? '') ?>
                                        </div>

                                        <div class="detail-rows">
                                            <div class="detail-row">
                                                <span>Tanggal</span>
                                                <b><?= esc(tgl_id($t['tanggal_transaksi'] ?? null)) ?></b>
                                            </div>
                                            <div class="detail-row">
                                                <span>Nomor HP</span>
                                                <b><?= esc($t['no_hp'] ?? '-') ?></b>
                                            </div>
                                            <div class="detail-row">
                                                <span>Metode</span>
                                                <b style="display:inline-flex;align-items:center;gap:6px">
                                                    <?= icon($metodeIkon, 14) ?>
                                                    <?= esc($metodeRow) ?>
                                                </b>
                                            </div>
                                        </div>

                                        <div>
                                            <div class="mini-label" style="color:var(--accent-ink)">PRODUK (<?= count($items) ?> ITEM)</div>
                                            <div class="sub-list" style="margin-top:8px">
                                                <?php foreach ($items as $it): ?>
                                                    <div class="sub-row">
                                                        <span>
                                                            <b style="color:var(--ink)"><?= esc($it['nama_barang']) ?></b>
                                                            <br>
                                                            <span style="font-size:12px;color:var(--muted)">
                                                                <?= esc($it['merek']) ?> · <?= (int) $it['jumlah'] ?> × <?= esc(rupiah($it['harga'])) ?>
                                                            </span>
                                                        </span>
                                                        <b><?= esc(rupiah($it['subtotal'])) ?></b>
                                                    </div>
                                                <?php endforeach; ?>
                                                <?php if ($items === []): ?>
                                                    <div class="empty-note" style="padding:12px 0">Tidak ada rincian produk.</div>
                                                <?php endif; ?>
                                            </div>
                                        </div>

                                        <?php if (($t['jenis'] ?? '') === 'pemesanan'): ?>
                                            <div>
                                                <div class="mini-label" style="color:var(--accent-ink)">RESEP MATA</div>
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
                                                    <b><?= esc(rupiah($t['diskon'] ?? 0)) ?></b>
                                                </div>
                                                <div class="sub-row total">
                                                    <span>Total Tagihan</span>
                                                    <b><?= esc(rupiah($t['total'] ?? 0)) ?></b>
                                                </div>
                                                <?php if ($metodeRow === 'Tunai'): ?>
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
                                    </div>
                                </td>
                            </tr>
                        <?php endif; ?>
                    <?php endforeach; ?>

                    <?php if ($rows === []): ?>
                        <tr>
                            <td colspan="6">
                                <div class="empty-note">Tidak ada transaksi atau pembayaran yang cocok dengan filter.</div>
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
    </section>
</div>
<?= $this->endSection() ?>
