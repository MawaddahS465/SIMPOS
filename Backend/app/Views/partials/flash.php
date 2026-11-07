<?php
$flashError   = session()->getFlashdata('error');
$flashSuccess = session()->getFlashdata('success');
?>

<?php if ($flashError): ?>
    <div class="alert alert-danger" role="alert">
        <?= esc($flashError) ?>
    </div>
<?php endif; ?>

<?php if ($flashSuccess): ?>
    <div class="alert alert-success" role="alert">
        <?= esc($flashSuccess) ?>
    </div>
<?php endif; ?>
