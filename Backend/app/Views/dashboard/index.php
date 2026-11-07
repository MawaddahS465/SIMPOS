<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>

<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-4 p-md-5">

        <h2 class="fw-bold mb-2">
            <?= esc($judul) ?>
        </h2>

        <p class="text-secondary">
            Selamat datang,
            <strong><?= esc(session()->get('nama')) ?></strong>.
            Kamu berhasil login ke sistem.
        </p>

        <hr>

        <div class="row g-3">
            <div class="col-md-4">
                <div class="p-3 rounded-3 bg-light">
                    <div class="text-secondary small">Username</div>
                    <div class="fw-semibold">
                        <?= esc(session()->get('username')) ?>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="p-3 rounded-3 bg-light">
                    <div class="text-secondary small">Peran</div>
                    <div class="fw-semibold">
                        <?= esc($role->label()) ?>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="p-3 rounded-3 bg-light">
                    <div class="text-secondary small">ID Cabang</div>
                    <div class="fw-semibold">
                        <?= esc((string) (session()->get('cabang_id') ?? 'Seluruh cabang')) ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="alert alert-info mt-4 mb-0">
            Ini adalah dashboard awal untuk menguji login.
            Fitur operasional akan ditambahkan secara bertahap.
        </div>

    </div>
</div>

<?= $this->endSection() ?>
