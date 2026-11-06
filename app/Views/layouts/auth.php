<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title><?= esc($judul ?? 'Login') ?> - SIMPOS Optik Mekar Jaya</title>

    <link rel="icon" type="image/svg+xml" href="<?= base_url('favicon.svg?v=20261106') ?>">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= base_url('favicon-32.png?v=20261106') ?>">
    <link rel="apple-touch-icon" href="<?= base_url('apple-touch-icon.png?v=20261106') ?>">
    <meta name="theme-color" content="#5b55fb">

    <link href="<?= base_url('assets/css/design/tokens.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/global.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/components.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/login.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/admin.css') ?>" rel="stylesheet">
    <link href="<?= base_url('assets/css/design/overrides.css') ?>" rel="stylesheet">
</head>

<body>
    <?= $this->renderSection('content') ?>
</body>
</html>
