<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$picking = $terpilih === null || request()->getGet('ubah') === '1';

$metodeAktif = $metode ?? 'Tunai';
$total       = (float) $ringkasan['total'];

$ikonMetode = [
    'Tunai'               => 'banknote',
    'Transfer Bank'       => 'building-2',
    'Kartu Debit/Kredit'  => 'credit-card',
    'QRIS'                => 'qr-code',
    'E-Wallet'            => 'wallet',
];
$ketMetode = [
    'Tunai'              => 'Pembayaran dengan uang tunai',
    'Transfer Bank'      => 'Pembayaran melalui transfer bank',
    'Kartu Debit/Kredit' => 'Visa, Mastercard, JCB, dll',
    'QRIS'               => 'Pembayaran dengan QRIS',
    'E-Wallet'           => 'GoPay, OVO, DANA, ShopeePay',
];
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <div class="overline">CHECKOUT</div>
                <h1>Lengkapi data transaksi dan selesaikan pembayaran</h1>
                <p>Pastikan data pelanggan, resep, dan ketersediaan stok produk sudah sesuai sebelum memproses pembayaran.</p>
            </div>
            <div class="pagehead-actions"><?= steps(2) ?></div>
        </div>
    </div>

    <div class="checkout-grid">
        <div class="checkout-left">
            <section class="co-card">
                <div class="section-head">
                    <h2>Data Pelanggan</h2>
                    <div class="section-action">
                        <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/checkout?tambah=1') ?>">
                            <?= icon('user-plus', 15) ?>
                            Tambah Pelanggan
                        </a>
                    </div>
                </div>

                <?php if ($terpilih !== null && ! $picking): ?>
                    <div class="cust-card">
                        <?= avatar($terpilih['nama_pelanggan'], 46) ?>
                        <div class="cc-body">
                            <b><?= esc($terpilih['nama_pelanggan']) ?></b>
                            <div class="cc-meta">
                                <span>PLG-<?= str_pad((string) $terpilih['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?></span>
                                <?php if (! empty($terpilih['no_hp'])): ?>
                                    <span><?= esc($terpilih['no_hp']) ?></span>
                                <?php endif; ?>
                            </div>
                            <?php if (! empty($terpilih['alamat'])): ?>
                                <div class="cc-meta"><?= esc($terpilih['alamat']) ?></div>
                            <?php endif; ?>
                        </div>
                        <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/checkout?ubah=1') ?>">Ubah</a>
                    </div>
                <?php else: ?>
                    <div>
                        <form method="get" action="<?= site_url('kasir/checkout') ?>">
                            <input type="hidden" name="ubah" value="1">
                            <label class="toolbar-search" style="margin-bottom:12px">
                                <?= icon('glasses', 16) ?>
                                <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari pelanggan (nama, nomor HP, atau kode).">
                            </label>
                        </form>

                        <form method="post" action="<?= site_url('kasir/checkout/pelanggan') ?>">
                            <?= csrf_field() ?>
                            <div class="cust-pick">
                                <?php foreach ($pelanggan as $c): ?>
                                    <button class="cust-pick-row" type="submit" name="pelanggan_id" value="<?= (int) $c['id_pelanggan'] ?>">
                                        <?= avatar($c['nama_pelanggan'], 40) ?>
                                        <span class="pick-body">
                                            <b><?= esc($c['nama_pelanggan']) ?></b>
                                            <span>PLG-<?= str_pad((string) $c['id_pelanggan'], 4, '0', STR_PAD_LEFT) ?> · <?= esc($c['no_hp'] ?? '-') ?></span>
                                        </span>
                                    </button>
                                <?php endforeach; ?>

                                <?php if ($pelanggan === []): ?>
                                    <div class="empty-note">Pelanggan tidak ditemukan.</div>
                                <?php endif; ?>
                            </div>
                        </form>
                    </div>
                <?php endif; ?>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Resep Mata</h2>
                    <div class="section-action">
                        <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/resep') ?>">Pilih Resep Tersimpan</a>
                    </div>
                </div>

                <?php if ($resep !== null): ?>
                    <table class="rx-table">
                        <thead>
                            <tr>
                                <th>Mata</th>
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
                                <td><?= esc($resep['od_sph'] ?? '-') ?></td>
                                <td><?= esc($resep['od_cyl'] !== null && $resep['od_cyl'] !== '' ? $resep['od_cyl'] : '0.00') ?></td>
                                <td><?= esc($resep['od_axis'] !== null && $resep['od_axis'] !== '' ? $resep['od_axis'] : '-') ?></td>
                                <td><?= esc($resep['add_power'] ?? '-') ?></td>
                                <td><?= esc($resep['pd'] ?? '-') ?></td>
                            </tr>
                            <tr>
                                <td>OS (Kiri)</td>
                                <td><?= esc($resep['os_sph'] ?? '-') ?></td>
                                <td><?= esc($resep['os_cyl'] !== null && $resep['os_cyl'] !== '' ? $resep['os_cyl'] : '0.00') ?></td>
                                <td><?= esc($resep['os_axis'] !== null && $resep['os_axis'] !== '' ? $resep['os_axis'] : '-') ?></td>
                                <td><?= esc($resep['add_power'] ?? '-') ?></td>
                                <td><?= esc($resep['pd'] ?? '-') ?></td>
                            </tr>
                        </tbody>
                    </table>
                <?php else: ?>
                    <div class="empty-note">
                        Belum ada resep tersimpan untuk pelanggan ini.
                    </div>
                <?php endif; ?>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Produk Dipilih</h2>
                    <div class="section-action">
                        <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/transaksi') ?>">
                            <?= icon('plus', 15) ?>
                            Tambah Produk
                        </a>
                    </div>
                </div>

                <?php if ($ringkasan['rows'] === []): ?>
                    <div class="empty-note">Belum ada produk dipilih.</div>
                <?php else: ?>
                    <?php foreach ($ringkasan['rows'] as $i): ?>
                        <div class="cart-line" style="flex-wrap:wrap">
                            <span class="cl-ico"><?= icon('glasses', 20) ?></span>
                            <span class="cl-body">
                                <b><?= esc($i['nama_barang']) ?></b>
                                <span>
                                    <?= esc($i['merek']) ?> · <?= esc($i['jenis']) ?> · Stok cabang: <?= (int) $i['stok'] ?> unit
                                </span>
                            </span>
                            <span class="qty-box">
                                <form class="inline-form" method="post" action="<?= site_url('kasir/transaksi/qty') ?>">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="barang_id" value="<?= (int) $i['id'] ?>">
                                    <input type="hidden" name="aksi" value="minus">
                                    <button type="submit" aria-label="Kurangi"><?= icon('minus', 14) ?></button>
                                </form>
                                <b><?= (int) $i['qty'] ?></b>
                                <form class="inline-form" method="post" action="<?= site_url('kasir/transaksi/qty') ?>">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="barang_id" value="<?= (int) $i['id'] ?>">
                                    <input type="hidden" name="aksi" value="plus">
                                    <button type="submit" aria-label="Tambah"><?= icon('plus', 14) ?></button>
                                </form>
                            </span>
                            <span class="ci-price"><?= rupiah($i['subtotal']) ?></span>
                            <form class="inline-form" method="post" action="<?= site_url('kasir/transaksi/hapus') ?>">
                                <?= csrf_field() ?>
                                <input type="hidden" name="barang_id" value="<?= (int) $i['id'] ?>">
                                <button class="ci-remove" type="submit" aria-label="Hapus <?= esc($i['nama_barang']) ?>">
                                    <?= icon('trash-2', 16) ?>
                                </button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </section>
        </div>

        <aside class="summary">
            <form method="post" action="<?= site_url('kasir/checkout/selesai') ?>" id="form-checkout">
                <?= csrf_field() ?>

                <div class="cart-head">
                    <h2>Ringkasan Transaksi</h2>
                    <span class="cart-count"><?= (int) $ringkasan['count'] ?> produk</span>
                </div>

                <div class="sum-row">
                    <span>Subtotal</span>
                    <b><?= rupiah($ringkasan['subtotal']) ?></b>
                </div>
                <div class="sum-row">
                    <span>% Diskon</span>
                    <span class="sum-inline">
                        <input class="sum-input" value="0" readonly aria-label="Diskon dalam persen">
                        <b>Rp 0</b>
                    </span>
                </div>
                <div class="sum-row">
                    <span>Pajak (PPN 11%)</span>
                    <b><?= rupiah($ringkasan['pajak']) ?></b>
                </div>

                <div class="sum-total">
                    <span>Total</span>
                    <b><?= rupiah($ringkasan['total']) ?></b>
                </div>

                <div class="mini-label" style="letter-spacing:1.3px">METODE PEMBAYARAN</div>
                <div class="pay-list">
                    <?php foreach ($daftarMetode as $m): ?>
                        <label class="pay-opt <?= $metodeAktif === $m ? 'on' : '' ?>">
                            <input type="radio" name="metode" value="<?= esc($m) ?>" <?= $metodeAktif === $m ? 'checked' : '' ?>>
                            <span class="po-ico"><?= icon($ikonMetode[$m] ?? 'wallet', 18) ?></span>
                            <span class="po-body">
                                <b><?= esc($m) ?></b>
                                <span><?= esc($ketMetode[$m] ?? '') ?></span>
                            </span>
                            <span class="radio-dot"></span>
                        </label>
                    <?php endforeach; ?>
                </div>

                <div class="cash-box" id="cash-box" <?= $metodeAktif !== 'Tunai' ? 'style="display:none"' : '' ?>>
                    <div class="cash-mode-toggle" role="group" aria-label="Cara pembayaran tunai">
                        <button type="button" class="cash-mode-btn on" id="cash-mode-exact" aria-pressed="true">
                            Uang Pas
                        </button>
                        <button type="button" class="cash-mode-btn" id="cash-mode-manual" aria-pressed="false">
                            Input Manual
                        </button>
                    </div>

                    <div class="cash-exact-display" id="cash-exact-panel">
                        <span>Jumlah Dibayar</span>
                        <b><?= rupiah($ringkasan['total']) ?></b>
                    </div>

                    <div class="cash-field" id="cash-manual-panel" style="display:none">
                        <div class="cash-label-row">
                            <label for="cash-paid-input">Jumlah Dibayar</label>
                        </div>
                        <div class="cash-input-wrap">
                            <span class="cash-prefix">Rp</span>
                            <input
                                id="cash-paid-input"
                                name="jumlah_dibayar"
                                type="text"
                                inputmode="numeric"
                                autocomplete="off"
                                placeholder="<?= number_format($total, 0, ',', '.') ?>"
                                value="<?= number_format($total, 0, ',', '.') ?>"
                            >
                        </div>
                    </div>

                    <div class="cash-change-row" id="cash-change-row">
                        <span id="cash-change-label">Kembalian</span>
                        <b id="cash-change-value">Rp 0</b>
                    </div>
                </div>

                <button class="btn btn-primary full" type="submit">Selesaikan Transaksi</button>
            </form>
        </aside>
    </div>
</div>

<?php if (request()->getGet('tambah') === '1'): ?>
    <div class="overlay">
        <div class="drawer" role="dialog" aria-modal="true">
            <div class="drawer-head">
                <div>
                    <h2>Tambah Pelanggan</h2>
                    <div class="section-desc">Pelanggan baru langsung dipilih untuk transaksi ini.</div>
                </div>
                <a class="icon-pill" aria-label="Tutup" href="<?= site_url('kasir/checkout') ?>">
                    <?= icon('x', 18) ?>
                </a>
            </div>

            <form class="drawer-form" method="post" action="<?= site_url('kasir/pelanggan') ?>">
                <?= csrf_field() ?>
                <input type="hidden" name="kembali" value="checkout">

                <label class="afield">
                    <span>Nama pelanggan</span>
                    <input name="nama_pelanggan" required minlength="2" placeholder="cth. Andi Saputra">
                </label>

                <label class="afield">
                    <span>Nomor HP</span>
                    <input name="no_hp" placeholder="cth. 0812 3456 7890">
                </label>

                <label class="afield">
                    <span>Alamat</span>
                    <input name="alamat" placeholder="cth. Jl. Khatib Sulaiman No. 12">
                </label>

                <div class="drawer-foot">
                    <a class="btn btn-ghost" href="<?= site_url('kasir/checkout') ?>">Batal</a>
                    <button type="submit" class="btn btn-primary">Tambah &amp; Pilih</button>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>

<script>
    (function () {
        var form = document.getElementById('form-checkout');

        if (!form) {
            return;
        }

        var total = <?= (int) $ringkasan['total'] ?>;

        var cashBox     = document.getElementById('cash-box');
        var exactBtn    = document.getElementById('cash-mode-exact');
        var manualBtn   = document.getElementById('cash-mode-manual');
        var exactPanel  = document.getElementById('cash-exact-panel');
        var manualPanel = document.getElementById('cash-manual-panel');
        var input       = document.getElementById('cash-paid-input');
        var changeRow   = document.getElementById('cash-change-row');
        var changeLabel = document.getElementById('cash-change-label');
        var changeValue = document.getElementById('cash-change-value');
        var radios      = form.querySelectorAll('input[name="metode"]');
        var payOpts     = form.querySelectorAll('.pay-opt');
        var mode        = 'exact';

        function formatRp(value) {
            return 'Rp ' + Math.round(value).toLocaleString('id-ID');
        }

        function refreshChange() {
            var digits = input.value.replace(/[^\d]/g, '');
            var paid   = digits === '' ? (mode === 'exact' ? total : 0) : Number(digits);
            var diff   = paid - total;

            if (diff < 0) {
                changeLabel.textContent = 'Kurang Bayar';
                changeValue.textContent = '- ' + formatRp(-diff);
                changeRow.classList.add('is-short');
            } else {
                changeLabel.textContent = 'Kembalian';
                changeValue.textContent = formatRp(diff);
                changeRow.classList.remove('is-short');
            }
        }

        function setMode(next) {
            mode = next;

            var exact = next === 'exact';

            exactBtn.classList.toggle('on', exact);
            exactBtn.setAttribute('aria-pressed', exact ? 'true' : 'false');
            manualBtn.classList.toggle('on', !exact);
            manualBtn.setAttribute('aria-pressed', exact ? 'false' : 'true');

            exactPanel.style.display  = exact ? '' : 'none';
            manualPanel.style.display = exact ? 'none' : '';

            if (exact) {
                input.value = String(total);
                refreshChange();
            } else {
                input.value = '';
                refreshChange();
                input.focus();
            }
        }

        function syncCashVisibility() {
            var checked = form.querySelector('input[name="metode"]:checked');
            var tunai   = checked !== null && checked.value === 'Tunai';

            cashBox.style.display = tunai ? '' : 'none';

            payOpts.forEach(function (opt) {
                var radio = opt.querySelector('input[name="metode"]');
                opt.classList.toggle('on', radio !== null && radio.checked);
            });

            if (tunai && mode === 'exact') {
                input.value = String(total);
                refreshChange();
            }
        }

        exactBtn.addEventListener('click', function () {
            setMode('exact');
        });

        manualBtn.addEventListener('click', function () {
            setMode('manual');
        });

        input.addEventListener('input', function () {
            var digits = input.value.replace(/[^\d]/g, '');
            input.value = digits === '' ? '' : Number(digits).toLocaleString('id-ID');
            refreshChange();
        });

        radios.forEach(function (radio) {
            radio.addEventListener('change', syncCashVisibility);
        });

        setMode('exact');
        syncCashVisibility();
    })();
</script>
<?= $this->endSection() ?>
