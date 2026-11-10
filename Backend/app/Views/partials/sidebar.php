<?php $uri = uri_string(); ?>

<div class="card border-0 shadow-sm rounded-4 sidebar-menu">
    <div class="card-body p-3">

        <div class="text-secondary small text-uppercase fw-semibold mb-2">Menu</div>

        <div class="list-group list-group-flush">
            <a href="<?= site_url('dashboard') ?>"
               class="list-group-item list-group-item-action border-0 rounded-3 <?= $uri === 'dashboard' ? 'active' : '' ?>">
                Dashboard
            </a>
        </div>

        <?php if (has_role('admin', 'pemilik')): ?>
            <div class="text-secondary small text-uppercase fw-semibold mt-3 mb-2">Master Data</div>

            <div class="list-group list-group-flush">
                <a href="<?= site_url('kategori') ?>"
                   class="list-group-item list-group-item-action border-0 rounded-3 <?= str_starts_with($uri, 'kategori') ? 'active' : '' ?>">
                    Kategori
                </a>
            </div>
        <?php endif; ?>

    </div>
</div>
