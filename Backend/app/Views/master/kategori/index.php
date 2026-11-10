<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>

<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
    <div>
        <h1 class="h3 fw-bold mb-1"><?= esc($judul) ?></h1>
        <p class="text-secondary mb-0">Daftar kategori barang optik.</p>
    </div>

    <a href="<?= site_url('kategori/baru') ?>" class="btn btn-primary">
        Tambah Kategori
    </a>
</div>

<form method="get" action="<?= site_url('kategori') ?>" class="row g-2 mb-3">
    <div class="col-sm-6 col-md-4">
        <input
            type="text"
            name="q"
            value="<?= esc($cari) ?>"
            class="form-control"
            placeholder="Cari kode atau nama"
        >
    </div>

    <div class="col-auto">
        <button class="btn btn-outline-secondary" type="submit">Cari</button>
    </div>

    <?php if ($cari !== ''): ?>
        <div class="col-auto">
            <a href="<?= site_url('kategori') ?>" class="btn btn-link">Reset</a>
        </div>
    <?php endif; ?>
</form>

<div class="card border-0 shadow-sm rounded-4">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead>
                <tr>
                    <th>Kode</th>
                    <th>Nama Kategori</th>
                    <th>Keterangan</th>
                    <th>Status</th>
                    <th class="text-end">Aksi</th>
                </tr>
            </thead>

            <tbody>
                <?php if ($kategori === []): ?>
                    <tr>
                        <td colspan="5" class="text-center text-secondary py-4">
                            Belum ada kategori.
                        </td>
                    </tr>
                <?php endif; ?>

                <?php foreach ($kategori as $row): ?>
                    <tr>
                        <td class="fw-semibold"><?= esc($row['kode_kategori']) ?></td>
                        <td><?= esc($row['nama_kategori']) ?></td>
                        <td><?= esc($row['keterangan'] ?? '-') ?></td>
                        <td>
                            <span class="badge <?= $row['status'] === 'aktif' ? 'text-bg-success' : 'text-bg-secondary' ?>">
                                <?= esc($row['status']) ?>
                            </span>
                        </td>
                        <td class="text-end text-nowrap">
                            <a href="<?= site_url('kategori/' . $row['id'] . '/edit') ?>"
                               class="btn btn-sm btn-outline-primary">
                                Edit
                            </a>

                            <form action="<?= site_url('kategori/' . $row['id'] . '/hapus') ?>"
                                  method="post"
                                  class="d-inline"
                                  onsubmit="return confirm('Hapus kategori ini?')">
                                <?= csrf_field() ?>
                                <button class="btn btn-sm btn-outline-danger" type="submit">Hapus</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div class="mt-3">
    <?= $pager->links() ?>
</div>

<?= $this->endSection() ?>
