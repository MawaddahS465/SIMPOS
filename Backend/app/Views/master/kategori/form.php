<?php
$edit   = $kategori !== null;
$errors = session()->getFlashdata('errors') ?? [];
?>

<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>

<div class="mb-3">
    <h1 class="h3 fw-bold mb-1"><?= esc($judul) ?></h1>
    <p class="text-secondary mb-0">Isi data kategori dengan lengkap.</p>
</div>

<?php if ($errors !== []): ?>
    <div class="alert alert-danger">
        Periksa kembali isian di bawah.
    </div>
<?php endif; ?>

<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-4">
        <form action="<?= $edit ? site_url('kategori/' . $kategori['id']) : site_url('kategori') ?>"
              method="post">
            <?= csrf_field() ?>

            <div class="mb-3">
                <label for="kode_kategori" class="form-label">Kode Kategori</label>
                <input
                    type="text"
                    id="kode_kategori"
                    name="kode_kategori"
                    value="<?= old('kode_kategori', $kategori['kode_kategori'] ?? '') ?>"
                    class="form-control <?= isset($errors['kode_kategori']) ? 'is-invalid' : '' ?>"
                    maxlength="20"
                    placeholder="Contoh: LENSA"
                >
                <?php if (isset($errors['kode_kategori'])): ?>
                    <div class="invalid-feedback"><?= esc($errors['kode_kategori']) ?></div>
                <?php endif; ?>
            </div>

            <div class="mb-3">
                <label for="nama_kategori" class="form-label">Nama Kategori</label>
                <input
                    type="text"
                    id="nama_kategori"
                    name="nama_kategori"
                    value="<?= old('nama_kategori', $kategori['nama_kategori'] ?? '') ?>"
                    class="form-control <?= isset($errors['nama_kategori']) ? 'is-invalid' : '' ?>"
                    maxlength="100"
                    placeholder="Contoh: Lensa"
                >
                <?php if (isset($errors['nama_kategori'])): ?>
                    <div class="invalid-feedback"><?= esc($errors['nama_kategori']) ?></div>
                <?php endif; ?>
            </div>

            <div class="mb-3">
                <label for="keterangan" class="form-label">Keterangan</label>
                <textarea
                    id="keterangan"
                    name="keterangan"
                    rows="3"
                    class="form-control"
                    placeholder="Opsional"
                ><?= old('keterangan', $kategori['keterangan'] ?? '') ?></textarea>
            </div>

            <div class="mb-4">
                <label for="status" class="form-label">Status</label>
                <select
                    id="status"
                    name="status"
                    class="form-select <?= isset($errors['status']) ? 'is-invalid' : '' ?>"
                >
                    <option value="aktif" <?= old('status', $kategori['status'] ?? 'aktif') === 'aktif' ? 'selected' : '' ?>>
                        Aktif
                    </option>
                    <option value="nonaktif" <?= old('status', $kategori['status'] ?? 'aktif') === 'nonaktif' ? 'selected' : '' ?>>
                        Nonaktif
                    </option>
                </select>
                <?php if (isset($errors['status'])): ?>
                    <div class="invalid-feedback"><?= esc($errors['status']) ?></div>
                <?php endif; ?>
            </div>

            <div class="d-flex gap-2">
                <button class="btn btn-primary" type="submit">Simpan</button>
                <a href="<?= site_url('kategori') ?>" class="btn btn-outline-secondary">Batal</a>
            </div>
        </form>
    </div>
</div>

<?= $this->endSection() ?>
