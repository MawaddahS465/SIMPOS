<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$qs = static fn (array $ubah): string => '?' . http_build_query(array_merge([
    'tab'   => $tab,
    'q'     => $cariQ,
    'merek' => $merek,
    'sort'  => $sort,
], $ubah));

$tagMap = [
    'P-007' => 'Visi tunggal',
    'P-008' => 'Anti biru',
    'P-009' => 'Progressif',
];
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <div class="overline">TRANSAKSI BARU</div>
                <h1>Pilih frame dan lensa untuk pelanggan</h1>
                <p>Tambahkan produk ke keranjang, lalu lanjutkan ke checkout untuk menyelesaikan transaksi.</p>
            </div>
            <div class="pagehead-actions"><?= steps(1) ?></div>
        </div>
    </div>

    <div class="catalog-grid">
        <div class="catalog-main">
            <div class="toolbar">
                <div class="toolbar-chips">
                    <?php foreach (['Semua', 'Frame', 'Lensa', 'Aksesoris'] as $kategori): ?>
                        <a class="chip <?= $tab === $kategori ? 'active' : '' ?>" href="<?= site_url('kasir/transaksi' . $qs(['tab' => $kategori])) ?>">
                            <?= esc($kategori) ?>
                        </a>
                    <?php endforeach; ?>
                </div>

                <form method="get" action="<?= site_url('kasir/transaksi') ?>" style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;">
                    <input type="hidden" name="tab" value="<?= esc($tab) ?>">
                    <input type="hidden" name="q" value="<?= esc($cariQ) ?>">

                    <select class="select-pill" name="merek" aria-label="Merek" onchange="this.form.submit()">
                        <option value="all">Merek</option>
                        <?php foreach ($merekList as $m): ?>
                            <option value="<?= esc($m) ?>" <?= $merek === $m ? 'selected' : '' ?>><?= esc($m) ?></option>
                        <?php endforeach; ?>
                    </select>

                    <select class="select-pill" name="sort" aria-label="Urutkan" onchange="this.form.submit()">
                        <option value="relevan" <?= $sort === 'relevan' ? 'selected' : '' ?>>Urutkan</option>
                        <option value="murah" <?= $sort === 'murah' ? 'selected' : '' ?>>Harga terendah</option>
                        <option value="mahal" <?= $sort === 'mahal' ? 'selected' : '' ?>>Harga tertinggi</option>
                    </select>
                </form>
            </div>

            <?php if ($katalog === []): ?>
                <div class="empty-note">Tidak ada produk yang cocok dengan filter.</div>
            <?php else: ?>
                <div class="product-grid">
                    <?php foreach ($katalog as $p): ?>
                        <form class="product-form" method="post" action="<?= site_url('kasir/transaksi/tambah') ?>">
                            <?= csrf_field() ?>
                            <input type="hidden" name="barang_id" value="<?= (int) $p['id'] ?>">
                            <button class="product-card" type="submit">
                                <div class="product-thumb">
                                    <?php if (isset($tagMap[$p['kode_barang']])): ?>
                                        <span class="pc-tag"><?= esc($tagMap[$p['kode_barang']]) ?></span>
                                    <?php endif; ?>
                                    <?= icon('glasses', 40) ?>
                                </div>
                                <div>
                                    <div class="pc-cat"><?= esc(mb_strtoupper($p['jenis'])) ?></div>
                                    <div class="pc-name"><?= esc($p['nama_barang']) ?></div>
                                    <div class="pc-brand"><?= esc($p['merek']) ?></div>
                                </div>
                                <div class="pc-foot">
                                    <b><?= rupiah($p['harga_jual']) ?></b>
                                    <span class="pc-add" aria-hidden="true"><?= icon('plus', 17) ?></span>
                                </div>
                            </button>
                        </form>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <aside class="cart-panel">
            <div class="cart-head">
                <h2>Keranjang</h2>
                <span class="cart-count"><?= (int) $ringkasan['count'] ?> produk</span>
            </div>

            <?php if ($ringkasan['rows'] === []): ?>
                <div class="cart-empty">
                    Keranjang masih kosong.
                    <br>
                    Pilih produk untuk memulai transaksi.
                </div>
            <?php else: ?>
                <?php foreach ($ringkasan['rows'] as $i): ?>
                    <div class="cart-item">
                        <span class="ci-ico"><?= icon('glasses', 20) ?></span>
                        <span class="ci-body">
                            <b><?= esc($i['nama_barang']) ?></b>
                            <span><?= esc($i['merek']) ?> · <?= esc($i['jenis']) ?> · <?= (int) $i['qty'] ?>×</span>
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

            <div class="cart-total">
                <span>Subtotal (<?= (int) $ringkasan['count'] ?> produk)</span>
                <b><?= rupiah($ringkasan['subtotal']) ?></b>
            </div>

            <a class="btn btn-primary full" href="<?= site_url('kasir/checkout') ?>"
               <?= $ringkasan['rows'] === [] ? 'style="opacity:.55;pointer-events:none"' : '' ?>
               aria-disabled="<?= $ringkasan['rows'] === [] ? 'true' : 'false' ?>">
                <?= icon('shopping-cart', 17) ?>
                Lanjut ke Checkout
                <?= icon('arrow-right', 16) ?>
            </a>
        </aside>
    </div>
</div>
<?= $this->endSection() ?>
