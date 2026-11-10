<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= esc($judul ?? 'SIMPOS') ?> - SIMPOS Optik Mekar Jaya</title>

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
    >
    <link href="<?= base_url('assets/css/app.css') ?>" rel="stylesheet">
</head>

<body class="bg-light">

    <nav class="navbar navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand fw-bold" href="<?= site_url('dashboard') ?>">
                👓 SIMPOS Optik Mekar Jaya
            </a>

            <form action="<?= site_url('logout') ?>" method="post" class="mb-0">
                <?= csrf_field() ?>
                <button class="btn btn-outline-light btn-sm" type="submit">
                    Logout
                </button>
            </form>
        </div>
    </nav>

    <main class="container py-4">
        <?= $this->include('partials/flash') ?>

        <div class="row g-4">
            <div class="col-lg-3 col-xl-2">
                <?= $this->include('partials/sidebar') ?>
            </div>

            <div class="col-lg-9 col-xl-10">
                <?= $this->renderSection('content') ?>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
