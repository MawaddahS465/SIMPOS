<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$metodeAktif        = old('metode') ?? 'Tunai';
$modeBayar          = old('mode_bayar') ?? 'exact';
$jumlahDibayarInput = old('jumlah_dibayar');
$kodePlg            = 'PLG-' . str_pad((string) $po['pelanggan_id'], 4, '0', STR_PAD_LEFT);
$jumlahProduk       = array_sum(array_map(static fn (array $row): int => (int) $row['jumlah'], $detail));
$stokCukup          = true;
$ikonMetode         = [
    'Tunai'              => 'banknote',
    'Transfer Bank'      => 'building-2',
    'Kartu Debit/Kredit' => 'credit-card',
    'QRIS'               => 'qr-code',
    'E-Wallet'           => 'wallet',
];
$ketMetode = [
    'Tunai'              => 'Pembayaran dengan uang tunai',
    'Transfer Bank'      => 'Pembayaran melalui transfer bank',
    'Kartu Debit/Kredit' => 'Visa, Mastercard, JCB, dll',
    'QRIS'               => 'Pembayaran dengan QRIS',
    'E-Wallet'           => 'GoPay, OVO, DANA, ShopeePay',
];

foreach ($detail as $item) {
    if ((int) $item['stok'] < (int) $item['jumlah']) {
        $stokCukup = false;
        break;
    }
}
?>
<div class="page">
    <div class="pagehead">
        <div class="crumbs">
            <a href="<?= site_url('kasir/dashboard') ?>">Kasir</a> ›
            <a href="<?= site_url('kasir/pemesanan') ?>">Pemesanan (PO)</a> ›
            <a href="<?= site_url('kasir/pemesanan/' . (int) $po['id_po']) ?>"><?= esc($po['kode_po']) ?></a> ›
            <b>Proses Pengambilan</b>
        </div>
        <div class="pagehead-main">
            <div>
                <h1>Proses Pengambilan</h1>
            </div>
            <div class="pagehead-actions">
                <a class="btn btn-ghost" href="<?= site_url('kasir/pemesanan/' . (int) $po['id_po']) ?>">
                    <?= icon('arrow-left', 16) ?>
                    Detail PO
                </a>
            </div>
        </div>
    </div>

    <?php if (! $stokCukup): ?>
        <div class="notice" role="alert">
            Stok cabang tidak mencukupi untuk seluruh produk pada PO ini. Hubungi Admin Cabang sebelum menyelesaikan pengambilan.
        </div>
    <?php endif; ?>

    <form class="po-pickup-grid" method="post" action="<?= site_url('kasir/pemesanan/' . (int) $po['id_po'] . '/pengambilan') ?>" id="form-pengambilan">
        <?= csrf_field() ?>
        <input type="hidden" name="mode_bayar" value="<?= esc($modeBayar, 'attr') ?>">

        <div class="checkout-left">
            <section class="co-card">
                <div class="section-head">
                    <h2>Data Pelanggan</h2>
                </div>
                <div class="cust-card">
                    <?= avatar($po['nama_pelanggan'] ?? '-', 46) ?>
                    <div class="cc-body">
                        <b><?= esc($po['nama_pelanggan'] ?? '-') ?></b>
                        <div class="cc-meta">
                            <span><?= esc($kodePlg) ?></span>
                            <span><?= esc($po['no_hp'] ?? '-') ?></span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Resep Mata</h2>
                </div>
                <?php if (! empty($po['resep_id'])): ?>
                    <div class="table-wrap">
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
                                    <td><?= esc($po['od_sph'] ?? '-') ?></td>
                                    <td><?= esc($po['od_cyl'] ?? '0.00') ?></td>
                                    <td><?= esc($po['od_axis'] ?? '-') ?></td>
                                    <td><?= esc($po['add_power'] ?? '-') ?></td>
                                    <td><?= esc($po['pd'] ?? '-') ?></td>
                                </tr>
                                <tr>
                                    <td>OS (Kiri)</td>
                                    <td><?= esc($po['os_sph'] ?? '-') ?></td>
                                    <td><?= esc($po['os_cyl'] ?? '0.00') ?></td>
                                    <td><?= esc($po['os_axis'] ?? '-') ?></td>
                                    <td><?= esc($po['add_power'] ?? '-') ?></td>
                                    <td><?= esc($po['pd'] ?? '-') ?></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div class="empty-note">PO ini tidak menyertakan resep mata.</div>
                <?php endif; ?>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Produk Dipilih</h2>
                    <span class="tag-mini"><?= count($detail) ?> produk</span>
                </div>
                <div class="checkout-items">
                    <?php foreach ($detail as $item): ?>
                        <div class="checkout-item">
                            <span class="cl-ico"><?= icon('glasses', 18) ?></span>
                            <span class="checkout-item-name">
                                <b><?= esc($item['nama_barang']) ?></b>
                                <span><?= esc($item['merek']) ?> · <?= esc($item['jenis']) ?> · Stok cabang: <?= (int) $item['stok'] ?> unit</span>
                            </span>
                            <span class="pickup-item-quantity"><?= (int) $item['jumlah'] ?></span>
                            <b class="checkout-item-total"><?= rupiah($item['subtotal']) ?></b>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>
        </div>

        <aside class="summary checkout-payment-card">
            <div class="checkout-payment-head">
                <div>
                    <h2>Ringkasan Transaksi</h2>
                    <p><?= esc($po['kode_po']) ?> · <?= $jumlahProduk ?> produk</p>
                </div>
                <?= status_pill('sudah_datang') ?>
            </div>

            <div class="checkout-payment-content">
                <section class="checkout-payment-section">
                    <div class="checkout-totals">
                        <div class="sum-row">
                            <span>Subtotal</span>
                            <b><?= rupiah($total) ?></b>
                        </div>
                        <div class="sum-row">
                            <span>Diskon</span>
                            <b>Rp 0</b>
                        </div>
                        <div class="sum-total">
                            <span>Total</span>
                            <b><?= rupiah($total) ?></b>
                        </div>
                    </div>
                </section>

                <section class="checkout-payment-section">
                    <div class="mini-label">METODE PEMBAYARAN</div>
                    <div class="pay-list">
                        <?php foreach ($daftarMetode as $metode): ?>
                            <label class="pay-opt <?= $metodeAktif === $metode ? 'on' : '' ?>">
                                <input type="radio" name="metode" value="<?= esc($metode) ?>" <?= $metodeAktif === $metode ? 'checked' : '' ?>>
                                <span class="po-ico"><?= icon($ikonMetode[$metode] ?? 'wallet', 18) ?></span>
                                <span class="po-body">
                                    <b><?= esc($metode) ?></b>
                                    <span><?= esc($ketMetode[$metode] ?? '') ?></span>
                                </span>
                                <span class="radio-dot"></span>
                            </label>
                        <?php endforeach; ?>
                    </div>

                    <div class="cash-box" id="cash-box" <?= $metodeAktif !== 'Tunai' ? 'style="display:none"' : '' ?>>
                        <div class="cash-mode-toggle" role="group" aria-label="Cara pembayaran tunai">
                            <button type="button" class="cash-mode-btn <?= $modeBayar !== 'manual' ? 'on' : '' ?>" id="cash-mode-exact" aria-pressed="<?= $modeBayar !== 'manual' ? 'true' : 'false' ?>">
                                Uang Pas
                            </button>
                            <button type="button" class="cash-mode-btn <?= $modeBayar === 'manual' ? 'on' : '' ?>" id="cash-mode-manual" aria-pressed="<?= $modeBayar === 'manual' ? 'true' : 'false' ?>">
                                Input Manual
                            </button>
                        </div>

                        <div class="cash-exact-display" id="cash-exact-panel" <?= $modeBayar === 'manual' ? 'style="display:none"' : '' ?>>
                            <span>Jumlah Dibayar</span>
                            <b><?= rupiah($total) ?></b>
                        </div>

                        <div class="cash-field" id="cash-manual-panel" <?= $modeBayar !== 'manual' ? 'style="display:none"' : '' ?>>
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
                                    value="<?= esc($jumlahDibayarInput ?? number_format($total, 0, ',', '.'), 'attr') ?>"
                                >
                            </div>
                        </div>

                        <div class="cash-change-row" id="cash-change-row">
                            <span id="cash-change-label">Kembalian</span>
                            <b id="cash-change-value">Rp 0</b>
                        </div>
                    </div>
                </section>
            </div>

            <div class="drawer-foot">
                <a class="btn btn-ghost" href="<?= site_url('kasir/pemesanan/' . (int) $po['id_po']) ?>">Batal</a>
                <button class="btn btn-primary" type="submit" <?= $stokCukup ? '' : 'disabled' ?>>Selesaikan Transaksi</button>
            </div>
        </aside>
    </form>
</div>

<script>
    (function () {
        var form = document.getElementById('form-pengambilan');

        if (!form) {
            return;
        }

        var total       = <?= (int) $total ?>;
        var cashBox     = document.getElementById('cash-box');
        var exactBtn    = document.getElementById('cash-mode-exact');
        var manualBtn   = document.getElementById('cash-mode-manual');
        var exactPanel  = document.getElementById('cash-exact-panel');
        var manualPanel = document.getElementById('cash-manual-panel');
        var input       = document.getElementById('cash-paid-input');
        var modeInput   = form.querySelector('input[name="mode_bayar"]');
        var changeRow   = document.getElementById('cash-change-row');
        var changeLabel = document.getElementById('cash-change-label');
        var changeValue = document.getElementById('cash-change-value');
        var radios      = form.querySelectorAll('input[name="metode"]');
        var payOpts     = form.querySelectorAll('.pay-opt');
        var mode        = modeInput.value === 'manual' ? 'manual' : 'exact';

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

        function setMode(next, resetValue) {
            mode = next;
            modeInput.value = next;
            var exact = next === 'exact';

            exactBtn.classList.toggle('on', exact);
            exactBtn.setAttribute('aria-pressed', exact ? 'true' : 'false');
            manualBtn.classList.toggle('on', !exact);
            manualBtn.setAttribute('aria-pressed', exact ? 'false' : 'true');
            exactPanel.style.display = exact ? '' : 'none';
            manualPanel.style.display = exact ? 'none' : '';

            if (exact) {
                input.value = String(total);
            } else if (resetValue) {
                input.value = '';
                input.focus();
            }

            refreshChange();
        }

        function syncPayment() {
            var checked = form.querySelector('input[name="metode"]:checked');
            var tunai   = checked !== null && checked.value === 'Tunai';

            cashBox.style.display = tunai ? '' : 'none';
            payOpts.forEach(function (option) {
                var radio = option.querySelector('input[name="metode"]');
                option.classList.toggle('on', radio !== null && radio.checked);
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
            setMode('manual', true);
        });
        input.addEventListener('input', function () {
            var digits = input.value.replace(/[^\d]/g, '');
            input.value = digits === '' ? '' : Number(digits).toLocaleString('id-ID');
            refreshChange();
        });
        radios.forEach(function (radio) {
            radio.addEventListener('change', syncPayment);
        });

        setMode(mode, false);
        syncPayment();
        refreshChange();
    })();
</script>
<?= $this->endSection() ?>
