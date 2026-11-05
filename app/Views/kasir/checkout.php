<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$metodeAktif = old('metode') ?? ($metode ?? 'Tunai');
$jumlahDibayarInput = old('jumlah_dibayar');
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
        <div class="pagehead-main <?= $konfirmasi && ! $ringkasanStep ? 'checkout-review-head' : (! $konfirmasi ? 'checkout-customer-head' : '') ?>">
            <div class="pagehead-actions"><?= steps($ringkasanStep ? 4 : ($konfirmasi ? 3 : 2)) ?></div>
        </div>
    </div>

    <?php if (! $konfirmasi): ?>
        <div class="checkout-grid checkout-customer-grid">
            <section class="co-card">
                <div class="section-head">
                    <div>
                        <h2>Pilih Pelanggan</h2>
                        <div class="section-desc">Pelanggan dipilih sebelum memeriksa resep dan produk transaksi.</div>
                    </div>
                    <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/checkout?tambah=1') ?>">
                        <?= icon('user-plus', 15) ?>
                        Tambah Pelanggan
                    </a>
                </div>

                <form method="get" action="<?= site_url('kasir/checkout') ?>">
                    <label class="toolbar-search" style="margin-bottom:12px">
                        <?= icon('search', 16) ?>
                        <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nama, nomor HP, atau kode pelanggan.">
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
                                <?= icon('chevron-right', 16) ?>
                            </button>
                        <?php endforeach; ?>

                        <?php if ($pelanggan === []): ?>
                            <div class="empty-note">Pelanggan tidak ditemukan. Coba kata pencarian lain atau tambahkan pelanggan baru.</div>
                        <?php endif; ?>
                    </div>
                </form>

                <a class="btn btn-ghost full" href="<?= site_url('kasir/transaksi') ?>">
                    <?= icon('arrow-left', 16) ?>
                    Kembali ke Pilih Produk
                </a>
            </section>

        </div>
    <?php elseif (! $ringkasanStep): ?>
    <div class="checkout-grid checkout-review-grid">
        <div class="checkout-left">
            <section class="co-card">
                <div class="section-head">
                    <h2>Data Pelanggan</h2>
                </div>

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
                    <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/checkout') ?>">Ubah</a>
                </div>
            </section>

            <section class="co-card">
                <div class="section-head">
                    <h2>Resep Mata</h2>
                    <div class="section-action">
                        <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/resep') ?>">Lihat Arsip Resep</a>
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
                                    <input type="hidden" name="kembali" value="kasir/checkout?step=confirm">
                                    <button type="submit" aria-label="Kurangi"><?= icon('minus', 14) ?></button>
                                </form>
                                <b><?= (int) $i['qty'] ?></b>
                                <form class="inline-form" method="post" action="<?= site_url('kasir/transaksi/qty') ?>">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="barang_id" value="<?= (int) $i['id'] ?>">
                                    <input type="hidden" name="aksi" value="plus">
                                    <input type="hidden" name="kembali" value="kasir/checkout?step=confirm">
                                    <button type="submit" aria-label="Tambah"><?= icon('plus', 14) ?></button>
                                </form>
                            </span>
                            <span class="ci-price"><?= rupiah($i['subtotal']) ?></span>
                            <form class="inline-form" method="post" action="<?= site_url('kasir/transaksi/hapus') ?>">
                                <?= csrf_field() ?>
                                <input type="hidden" name="barang_id" value="<?= (int) $i['id'] ?>">
                                <input type="hidden" name="kembali" value="kasir/checkout?step=confirm">
                                <button class="ci-remove" type="submit" aria-label="Hapus <?= esc($i['nama_barang']) ?>">
                                    <?= icon('trash-2', 16) ?>
                                </button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </section>
        </div>

        <div class="drawer-foot checkout-review-actions">
            <a class="btn btn-ghost" href="<?= site_url('kasir/checkout') ?>">
                <?= icon('arrow-left', 16) ?>
                Ubah Pelanggan
            </a>
            <a class="btn btn-primary" href="<?= site_url('kasir/checkout?step=payment') ?>">
                Lanjut ke Ringkasan
                <?= icon('arrow-right', 16) ?>
            </a>
        </div>
    </div>
    <?php else: ?>
    <div class="checkout-grid checkout-payment-grid">
        <aside class="summary checkout-payment-card">
            <form method="post" action="<?= site_url('kasir/checkout/selesai') ?>" id="form-checkout">
                <?= csrf_field() ?>
                <input type="hidden" name="mode_bayar" value="<?= esc(old('mode_bayar') ?? 'exact', 'attr') ?>">

                <div class="checkout-payment-head">
                    <div>
                        <h2>Ringkasan Pesanan</h2>
                        <p><?= esc($terpilih['nama_pelanggan']) ?> · <?= (int) $ringkasan['count'] ?> unit</p>
                    </div>
                    <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/checkout?step=confirm') ?>">Ubah Pilihan</a>
                </div>

                <div class="checkout-payment-content">
                    <section class="checkout-payment-section">
                        <div class="mini-label">PRODUK DIPILIH</div>
                        <div class="checkout-items">
                            <?php foreach ($ringkasan['rows'] as $item): ?>
                                <div class="checkout-item">
                                    <span class="cl-ico"><?= icon('glasses', 18) ?></span>
                                    <span class="checkout-item-name">
                                        <b><?= esc($item['nama_barang']) ?></b>
                                        <span><?= (int) $item['qty'] ?> × <?= rupiah($item['harga_jual']) ?></span>
                                    </span>
                                    <b class="checkout-item-total"><?= rupiah($item['subtotal']) ?></b>
                                </div>
                            <?php endforeach; ?>
                        </div>

                        <div class="checkout-totals">
                            <div class="sum-row">
                                <span>Subtotal</span>
                                <b><?= rupiah($ringkasan['subtotal']) ?></b>
                            </div>
                            <div class="sum-row">
                                <span>Diskon</span>
                                <b>Rp 0</b>
                            </div>
                            <div class="sum-row">
                                <span>Pajak (PPN 11%)</span>
                                <b><?= rupiah($ringkasan['pajak']) ?></b>
                            </div>
                            <div class="sum-total">
                                <span>Total</span>
                                <b><?= rupiah($ringkasan['total']) ?></b>
                            </div>
                        </div>
                    </section>

                    <section class="checkout-payment-section">
                        <div class="mini-label">METODE PEMBAYARAN</div>
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
                    <a class="btn btn-ghost" href="<?= site_url('kasir/checkout?step=confirm') ?>">
                        <?= icon('arrow-left', 16) ?>
                        Periksa Kembali
                    </a>
                    <button class="btn btn-primary" type="submit">Selesaikan Transaksi</button>
                </div>
            </form>
        </aside>
    </div>
    <?php endif; ?>
</div>

<?php if (! $konfirmasi && request()->getGet('tambah') === '1'): ?>
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
                    <input name="nama_pelanggan" required minlength="2" value="<?= esc(old('nama_pelanggan', ''), 'attr') ?>" placeholder="cth. Andi Saputra">
                </label>

                <label class="afield">
                    <span>Nomor HP</span>
                    <input name="no_hp" value="<?= esc(old('no_hp', ''), 'attr') ?>" placeholder="cth. 0812 3456 7890">
                </label>

                <label class="afield">
                    <span>Alamat</span>
                    <input name="alamat" value="<?= esc(old('alamat', ''), 'attr') ?>" placeholder="cth. Jl. Khatib Sulaiman No. 12">
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
        var modeInput   = form.querySelector('input[name="mode_bayar"]');
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

        function setMode(next, resetValue) {
            mode = next;
            modeInput.value = next;

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
            } else if (resetValue) {
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

        setMode(modeInput.value === 'manual' ? 'manual' : 'exact', false);
        syncCashVisibility();
        refreshChange();
    })();
</script>
<?= $this->endSection() ?>
