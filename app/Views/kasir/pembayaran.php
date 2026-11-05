<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$filterList = [
    'Semua'      => '',
    'Lunas'      => 'lunas',
    'Pending'    => 'pending',
    'Dibatalkan' => 'dibatalkan',
];

$ikonMetode = [
    'Tunai'              => 'banknote',
    'Transfer Bank'      => 'wallet',
    'Kartu Debit/Kredit' => 'credit-card',
    'QRIS'               => 'qr-code',
    'E-Wallet'           => 'wallet',
];
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs"><b>Kasir</b> › Pembayaran</div>
        <div class="pagehead-main">
            <div>
                <div class="overline">KEUANGAN CABANG</div>
                <h1>Pembayaran</h1>
                <p>Rekap pembayaran transaksi di <?= esc(current_branch_name()) ?>.</p>
            </div>
        </div>
    </div>

    <div class="stat-row">
        <div class="stat-card tone-green">
            <div class="stat-body">
                <div class="stat-label">Total diterima</div>
                <div class="stat-value"><?= rupiah($diterima) ?></div>
                <div class="stat-caption">Pembayaran berstatus lunas</div>
            </div>
            <span class="stat-icon"><?= icon('banknote', 22) ?></span>
        </div>
        <div class="stat-card tone-amber">
            <div class="stat-body">
                <div class="stat-label">Menunggu pembayaran</div>
                <div class="stat-value"><?= rupiah($pending) ?></div>
                <div class="stat-caption">Belum diselesaikan</div>
            </div>
            <span class="stat-icon"><?= icon('wallet', 22) ?></span>
        </div>
        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Jumlah transaksi</div>
                <div class="stat-value"><?= (int) $total ?></div>
                <div class="stat-caption">Pada periode ini</div>
            </div>
            <span class="stat-icon"><?= icon('credit-card', 22) ?></span>
        </div>
    </div>

    <section class="section-block">
        <div class="section-head">
            <div>
                <h2>Daftar Pembayaran</h2>
                <div class="section-desc">Riwayat pembayaran terbaru</div>
            </div>
            <div class="section-action">
                <form method="get" action="<?= site_url('kasir/pembayaran') ?>">
                    <input type="hidden" name="q" value="<?= esc($cariQ) ?>">
                    <input type="hidden" name="status" value="<?= esc($status) ?>">
                    <select class="select-pill" name="metode" aria-label="Metode" onchange="this.form.submit()">
                        <option value="">Semua Metode</option>
                        <?php foreach ($metodeList as $m): ?>
                            <option value="<?= esc($m) ?>" <?= $metode === $m ? 'selected' : '' ?>><?= esc($m) ?></option>
                        <?php endforeach; ?>
                    </select>
                </form>
            </div>
        </div>

        <form class="toolbar" method="get" action="<?= site_url('kasir/pembayaran') ?>">
            <input type="hidden" name="metode" value="<?= esc($metode) ?>">
            <label class="toolbar-search">
                <?= icon('search', 16) ?>
                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nomor pembayaran atau nama pelanggan...">
            </label>

            <div class="toolbar-chips">
                <select class="chip-select" name="status" aria-label="Filter Status" onchange="this.form.submit()">
                    <?php foreach ($filterList as $label => $kunci): ?>
                        <option value="<?= esc($kunci) ?>" <?= $status === $kunci ? 'selected' : '' ?>>
                            <?= $kunci === '' ? 'Semua Status' : esc($label) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </form>

        <div class="table-wrap">
            <table class="tt">
                <thead>
                    <tr>
                        <th>NO. PEMBAYARAN</th>
                        <th>TANGGAL</th>
                        <th>PELANGGAN</th>
                        <th>METODE</th>
                        <th>JUMLAH</th>
                        <th>STATUS</th>
                        <th class="tt-right">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rows as $p): ?>
                        <tr>
                            <td>
                                <div class="tt-num">PAY-<?= date('Ymd', strtotime($p['tanggal_pembayaran'])) ?>-<?= str_pad((string) $p['id_pembayaran'], 3, '0', STR_PAD_LEFT) ?></div>
                                <div class="tt-sub"><?= esc($p['kode_transaksi']) ?></div>
                            </td>
                            <td><?= esc(tgl_id($p['tanggal_pembayaran'])) ?></td>
                            <td>
                                <div class="tt-num" style="font-size:13px"><?= esc($p['nama_pelanggan'] ?? '-') ?></div>
                            </td>
                            <td>
                                <span class="type-chip">
                                    <?= icon($ikonMetode[$p['metode_pembayaran']] ?? 'credit-card', 14) ?>
                                    <?= esc($p['metode_pembayaran']) ?>
                                </span>
                            </td>
                            <td class="tt-money"><?= rupiah($p['jumlah_bayar']) ?></td>
                            <td><?= status_pill($p['status']) ?></td>
                            <td class="tt-right">
                                <a class="link-action" href="<?= site_url('kasir/riwayat/' . (int) $p['transaksi_id']) ?>">
                                    Detail
                                    <?= icon('chevron-right', 15) ?>
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if ($rows === []): ?>
                        <tr>
                            <td colspan="7"><div class="empty-note">Tidak ada pembayaran yang cocok dengan filter.</div></td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            <div class="table-foot">
                <span class="foot-note">Menampilkan <?= count($rows) ?> dari <?= (int) $total ?> pembayaran</span>
            </div>
        </div>
    </section>
</div>
<?= $this->endSection() ?>
