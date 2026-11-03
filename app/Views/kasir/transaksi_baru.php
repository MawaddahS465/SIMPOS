<?= $this->extend('layouts/kasir') ?>

<?= $this->section('content') ?>
<?php
$tagMap = [
    'P-007' => 'Visi tunggal',
    'P-008' => 'Anti biru',
    'P-009' => 'Progressif',
];

$cartQty = [];
foreach ($ringkasan['rows'] as $row) {
    $cartQty[(int) $row['id']] = (int) $row['qty'];
}

$adaItem = $ringkasan['rows'] !== [];
?>
<div class="page">
    <div class="pagehead">
        <div class="pagehead-main">
            <div>
                <div class="overline">TRANSAKSI BARU &amp; CEK STOK CABANG</div>
                <h1>Pilih frame dan lensa untuk pelanggan</h1>
                <p>Periksa ketersediaan stok cabang, tambahkan produk ke keranjang, atau ajukan PO bila stok habis.</p>
            </div>
        </div>
    </div>

    <div class="catalog-grid">
        <div class="catalog-main">
            <form class="toolbar" method="get" action="<?= site_url('kasir/transaksi') ?>">
                <label class="toolbar-search">
                    <?= icon('search', 16) ?>
                    <input type="search" name="q" value="<?= esc($cariQ) ?>" placeholder="Cari nama produk, merek, atau kode barang...">
                </label>

                <div class="toolbar-chips">
                    <select class="chip-select" name="tab" aria-label="Kategori" onchange="this.form.submit()">
                        <?php foreach (['Semua', 'Frame', 'Lensa', 'Aksesoris'] as $kategori): ?>
                            <option value="<?= esc($kategori) ?>" <?= $tab === $kategori ? 'selected' : '' ?>>
                                <?= $kategori === 'Semua' ? 'Semua Kategori' : esc($kategori) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>

                    <select class="chip-select" name="merek" aria-label="Merek" onchange="this.form.submit()">
                        <option value="all">Semua Merek</option>
                        <?php foreach ($merekList as $m): ?>
                            <option value="<?= esc($m) ?>" <?= $merek === $m ? 'selected' : '' ?>><?= esc($m) ?></option>
                        <?php endforeach; ?>
                    </select>

                    <select class="chip-select" name="sort" aria-label="Urutkan" onchange="this.form.submit()">
                        <option value="relevan" <?= $sort === 'relevan' ? 'selected' : '' ?>>Urutkan</option>
                        <option value="murah" <?= $sort === 'murah' ? 'selected' : '' ?>>Harga terendah</option>
                        <option value="mahal" <?= $sort === 'mahal' ? 'selected' : '' ?>>Harga tertinggi</option>
                    </select>
                </div>
            </form>

            <div class="product-grid">
                <?php foreach ($katalog as $p): ?>
                    <?php
                    $pid        = (int) $p['id'];
                    $stok       = (int) $p['stok'];
                    $minimum    = (int) $p['stok_minimum'];
                    $habis      = $stok <= 0;
                    $menipis    = $stok > 0 && $stok <= $minimum;
                    $qtyDiCart  = $cartQty[$pid] ?? 0;

                    if ($habis) {
                        $badgeBg  = 'var(--danger-bg)';
                        $badgeInk = 'var(--danger-ink)';
                        $badgeTxt = 'Stok Habis (0)';
                    } elseif ($menipis) {
                        $badgeBg  = 'var(--warn-bg)';
                        $badgeInk = 'var(--warn-ink)';
                        $badgeTxt = 'Sisa ' . $stok . ' unit';
                    } else {
                        $badgeBg  = 'var(--ok-bg)';
                        $badgeInk = 'var(--ok-ink)';
                        $badgeTxt = 'Stok ' . $stok . ' unit';
                    }
                    ?>
                    <form class="product-card <?= $qtyDiCart > 0 ? 'is-selected' : '' ?>" method="post"
                          action="<?= site_url('kasir/transaksi/tambah') ?>">
                        <?= csrf_field() ?>
                        <input type="hidden" name="barang_id" value="<?= $pid ?>">

                        <div class="product-thumb">
                            <?php if (isset($tagMap[$p['kode_barang']])): ?>
                                <span class="pc-tag"><?= esc($tagMap[$p['kode_barang']]) ?></span>
                            <?php endif; ?>
                            <?php if ($qtyDiCart > 0): ?>
                                <span class="pc-in-cart-badge"><?= icon('check', 12) ?><?= $qtyDiCart ?> di keranjang</span>
                            <?php endif; ?>
                            <?= icon('glasses', 40) ?>
                        </div>

                        <div>
                            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                                <div class="pc-cat"><?= esc(mb_strtoupper($p['jenis'])) ?></div>
                                <span class="tag-mini" style="display:inline-flex;align-items:center;gap:4px;background:<?= $badgeBg ?>;color:<?= $badgeInk ?>">
                                    <?= icon('boxes', 11) ?>
                                    <?= esc($badgeTxt) ?>
                                </span>
                            </div>
                            <div class="pc-name"><?= esc($p['nama_barang']) ?></div>
                            <div class="pc-brand"><?= esc($p['merek']) ?> Â· <?= esc($p['kode_barang']) ?></div>
                        </div>

                        <div class="pc-foot">
                            <b><?= rupiah($p['harga_jual']) ?></b>

                            <?php if ($habis): ?>
                                <a class="btn btn-ghost btn-sm" href="<?= site_url('kasir/pemesanan?buat=1') ?>">
                                    <?= icon('clipboard-list', 14) ?>
                                    Buat PO
                                </a>
                            <?php elseif ($qtyDiCart > 0): ?>
                                <div class="pc-stepper">
                                    <button type="submit" name="aksi" value="minus"
                                            formaction="<?= site_url('kasir/transaksi/qty') ?>"
                                            aria-label="Kurangi <?= esc($p['nama_barang']) ?>">
                                        <?= icon('minus', 13) ?>
                                    </button>
                                    <b><?= $qtyDiCart ?></b>
                                    <button type="submit" name="aksi" value="plus"
                                            formaction="<?= site_url('kasir/transaksi/qty') ?>"
                                            aria-label="Tambah <?= esc($p['nama_barang']) ?>">
                                        <?= icon('plus', 13) ?>
                                    </button>
                                </div>
                            <?php else: ?>
                                <button type="submit" class="pc-add-pill" aria-label="Tambah <?= esc($p['nama_barang']) ?>">
                                    <?= icon('plus', 15) ?>
                                    Tambah
                                </button>
                            <?php endif; ?>
                        </div>
                    </form>
                <?php endforeach; ?>

                <?php if ($katalog === []): ?>
                    <div class="empty-note" style="grid-column:1 / -1">
                        Tidak ada produk yang cocok dengan pencarian atau filter.
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <aside class="cart-panel">
            <div class="cart-head-rich">
                <div class="cart-head-left">
                    <div class="cart-head-icon">
                        <?= icon('shopping-bag', 19) ?>
                        <?php if ($ringkasan['count'] > 0): ?>
                            <span class="cart-head-dot"><?= (int) $ringkasan['count'] ?></span>
                        <?php endif; ?>
                    </div>
                    <div>
                        <h2>Keranjang</h2>
                        <p><?= $ringkasan['count'] > 0 ? (int) $ringkasan['count'] . ' item dipilih' : 'Belum ada produk' ?></p>
                    </div>
                </div>

                <?php if ($adaItem): ?>
                    <form id="form-kosongkan" class="inline-form" style="display:none" method="post" action="<?= site_url('kasir/transaksi/hapus') ?>">
                        <?= csrf_field() ?>
                        <input type="hidden" name="semua" value="1">
                    </form>
                    <button type="submit" form="form-kosongkan" class="cart-clear-btn" title="Kosongkan seluruh isi keranjang">
                        <?= icon('trash-2', 13) ?>
                        Kosongkan
                    </button>
                <?php endif; ?>
            </div>

            <?php if ($adaItem): ?>
                <div class="cart-items-list">
                    <?php foreach ($ringkasan['rows'] as $i): ?>
                        <?php $iid = (int) $i['id']; ?>
                        <form id="fq-<?= $iid ?>" class="inline-form" style="display:none" method="post" action="<?= site_url('kasir/transaksi/qty') ?>">
                            <?= csrf_field() ?>
                            <input type="hidden" name="barang_id" value="<?= $iid ?>">
                        </form>
                        <form id="fh-<?= $iid ?>" class="inline-form" style="display:none" method="post" action="<?= site_url('kasir/transaksi/hapus') ?>">
                            <?= csrf_field() ?>
                            <input type="hidden" name="barang_id" value="<?= $iid ?>">
                        </form>

                        <div class="cart-item-card">
                            <div class="cic-top">
                                <span class="ci-ico"><?= icon('glasses', 20) ?></span>
                                <div class="cic-info">
                                    <div class="cic-cat-row">
                                        <span class="cic-cat"><?= esc($i['jenis']) ?></span>
                                        <span class="cic-unit-price">@ <?= rupiah($i['harga_jual']) ?></span>
                                    </div>
                                    <b><?= esc($i['nama_barang']) ?></b>
                                    <span><?= esc($i['merek']) ?></span>
                                </div>
                                <button type="submit" form="fh-<?= $iid ?>" class="ci-remove"
                                        aria-label="Hapus <?= esc($i['nama_barang']) ?>" title="Hapus dari keranjang">
                                    <?= icon('trash-2', 15) ?>
                                </button>
                            </div>

                            <div class="cic-bottom">
                                <div class="cic-stock">
                                    <span class="cic-stock-ok">
                                        <?= icon('boxes', 12) ?>
                                        Stok cabang: <?= (int) $i['stok'] ?> unit
                                    </span>
                                </div>
                                <div class="cic-controls">
                                    <span class="qty-box">
                                        <button type="submit" form="fq-<?= $iid ?>" name="aksi" value="minus" aria-label="Kurangi">
                                            <?= icon('minus', 13) ?>
                                        </button>
                                        <b><?= (int) $i['qty'] ?></b>
                                        <button type="submit" form="fq-<?= $iid ?>" name="aksi" value="plus" aria-label="Tambah">
                                            <?= icon('plus', 13) ?>
                                        </button>
                                    </span>
                                    <span class="ci-price"><?= rupiah($i['subtotal']) ?></span>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <div class="cart-summary-box">
                <div class="csb-row">
                    <span>Jenis Produk</span>
                    <b><?= count($ringkasan['rows']) ?> produk</b>
                </div>
                <div class="csb-row">
                    <span>Total Kuantitas</span>
                    <b><?= (int) $ringkasan['count'] ?> unit</b>
                </div>
                <div class="csb-total">
                    <span>Estimasi Subtotal</span>
                    <b><?= rupiah($ringkasan['subtotal']) ?></b>
                </div>
            </div>

            <a class="btn btn-primary full cart-checkout-btn" href="<?= site_url('kasir/checkout') ?>"
               <?= $adaItem ? '' : 'style="opacity:.55;pointer-events:none"' ?>
               aria-disabled="<?= $adaItem ? 'false' : 'true' ?>">
                <?= icon('shopping-bag', 17) ?>
                <?= $adaItem
                    ? 'Lanjut ke Checkout (' . (int) $ringkasan['count'] . ' unit)'
                    : 'Pilih Produk Terlebih Dahulu' ?>
                <?= icon('arrow-right', 16) ?>
            </a>
        </aside>
    </div>
</div>
<?= $this->endSection() ?>
