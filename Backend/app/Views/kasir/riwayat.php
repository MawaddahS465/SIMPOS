<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static function (array $ubah = []) use ($status, $metode, $cariQ, $periode, $dari, $sampai): string {
    $params = array_merge([
        'status'  => $status,
        'metode'  => $metode,
        'q'       => $cariQ,
        'periode' => $periode,
        'dari'    => $dari,
        'sampai'  => $sampai,
    ], $ubah);

    $params = array_filter($params, static fn ($v): bool => $v !== null && $v !== '');

    return $params === [] ? '' : '?' . http_build_query($params);
};

$periodeList = [
    'semua'    => 'Semua Periode',
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
    'E-Wallet'      => 'E-Wallet',
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
                <h1>Riwayat Transaksi</h1>
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
                <a class="btn btn-primary" href="<?= site_url('kasir/riwayat' . $qs(['ekspor' => '1'])) ?>">
                    <?= icon('download', 16) ?>
                    Ekspor CSV
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
                <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/riwayat' . $qs(['periode' => 'semua', 'dari' => null, 'sampai' => null])) ?>">
                    Reset Periode
                </a>
            </form>
        </div>
    <?php endif; ?>

    <div class="stat-row riwayat-summary">
        <div class="stat-card tone-green">
            <div class="stat-body">
                <div class="stat-label">Total diterima (Lunas)</div>
                <div class="stat-value"><?= esc(rupiah($diterima)) ?></div>
            </div>
            <span class="stat-icon"><?= icon('banknote', 22) ?></span>
        </div>

        <div class="stat-card tone-blue">
            <div class="stat-body">
                <div class="stat-label">Transaksi selesai</div>
                <div class="stat-value"><?= (int) $selesaiCount ?></div>
            </div>
            <span class="stat-icon"><?= icon('wallet', 22) ?></span>
        </div>

        <div class="stat-card tone-violet">
            <div class="stat-body">
                <div class="stat-label">Jumlah ditampilkan</div>
                <div class="stat-value"><?= (int) $jumlah ?></div>
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
                        $metodeRow = (string) ($t['metode_pembayaran'] ?? 'Tunai');

                        if ($metodeRow === '') {
                            $metodeRow = 'Tunai';
                        }

                        $metodeShort = $metodeRow === 'Kartu Debit/Kredit' ? 'Kartu' : $metodeRow;
                        $metodeIkon  = $metodeIkonMap[$metodeRow] ?? 'wallet';
                        $waktu       = strtotime((string) ($t['tanggal_transaksi'] ?? ''));
                        $jam         = $waktu !== false ? date('H:i', $waktu) : '-';
                        $rowUrl      = site_url('kasir/riwayat' . $qs(['buka' => $id]));
                        ?>
                        <tr class="<?= (int) ($trx['id_transaksi'] ?? 0) === $id ? 'is-active' : '' ?>">
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
                                <a
                                    class="link-action"
                                    href="<?= esc($rowUrl) ?>"
                                    id="riwayat-detail-trigger-<?= $id ?>"
                                    data-riwayat-detail-trigger
                                >
                                    Lihat Detail
                                    <?= icon('chevron-right', 15) ?>
                                </a>
                            </td>
                        </tr>

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
                </div>
            </div>
        </div>
    </section>

    <?php if ($trx !== null): ?>
        <?= $this->include('kasir/_riwayat_drawer') ?>
    <?php endif; ?>
</div>

<script>
    (function () {
        var storageKey = 'riwayat-detail-trigger';
        var dialog = document.getElementById('riwayat-detail-dialog');

        document.querySelectorAll('[data-riwayat-detail-trigger]').forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                sessionStorage.setItem(storageKey, trigger.id);
            });
        });

        if (!dialog) {
            var triggerId = sessionStorage.getItem(storageKey);

            if (triggerId) {
                var trigger = document.getElementById(triggerId);

                if (trigger) {
                    trigger.focus();
                }

                sessionStorage.removeItem(storageKey);
            }

            return;
        }

        var closeLink = dialog.querySelector('.drawer-head [data-riwayat-detail-close]');

        if (closeLink) {
            closeLink.focus();
        }

        var focusableElements = dialog.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && closeLink) {
                event.preventDefault();
                window.location.href = closeLink.href;
                return;
            }

            if (event.key !== 'Tab' || focusableElements.length === 0) {
                return;
            }

            var firstElement = focusableElements[0];
            var lastElement = focusableElements[focusableElements.length - 1];

            if (!dialog.contains(document.activeElement)) {
                event.preventDefault();
                firstElement.focus();
            } else if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        });
    })();
</script>
<?= $this->endSection() ?>
