<?= $this->extend('layouts/auth') ?>

<?= $this->section('content') ?>

<div class="page-bg auth">
    <div class="auth-card">

        <section class="auth-visual">
            <img src="<?= base_url('assets/img/login-approved-visual.jpg') ?>" alt="Koleksi kacamata Optik Mekar Jaya">
            <div class="tint"></div>

            <div class="auth-copy">
                <h1>
                    Solusi Penglihatan untuk Hidup yang <em>Lebih Baik</em>
                </h1>
                <p>
                    Layanan optik modern dengan produk berkualitas dan pelayanan profesional
                    untuk setiap gaya Anda.
                </p>
            </div>

            <div class="auth-tags" aria-hidden="true">
                <span>FRAME</span>
                <span>LENSA</span>
                <span>GAYA</span>
            </div>
        </section>

        <section class="auth-form">
            <div class="form-brand">
                <span class="mark">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="6" cy="15" r="4"/>
                        <circle cx="18" cy="15" r="4"/>
                        <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
                        <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/>
                        <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/>
                    </svg>
                </span>
                <b>Optik Mekar Jaya</b>
            </div>

            <h2><?= esc($judulMasuk) ?></h2>
            <p class="sub"><?= esc($subJudul) ?></p>

            <form id="form-login" action="<?= site_url('login') ?>" method="post" novalidate>
                <?= csrf_field() ?>

                <?php if ($pesanError !== null && $pesanError !== ''): ?>
                    <div class="form-error" role="alert"><?= esc($pesanError) ?></div>
                <?php endif; ?>

                <?php if ($pesanSukses !== null && $pesanSukses !== ''): ?>
                    <div class="form-success" role="status"><?= esc($pesanSukses) ?></div>
                <?php endif; ?>

                <div class="field">
                    <label for="username">Username</label>
                    <div class="input-wrap">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value="<?= old('username', $usernameTersimpan) ?>"
                            placeholder="Masukkan username"
                            autocomplete="username"
                            maxlength="50"
                            required
                            autofocus
                        >
                    </div>
                </div>

                <div class="field">
                    <label for="password">Password</label>
                    <div class="input-wrap">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Masukkan password anda"
                            autocomplete="current-password"
                            required
                        >
                        <button
                            type="button"
                            class="toggle"
                            id="toggle-password"
                            aria-label="Tampilkan password"
                        >
                            <svg class="icon-eye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            <svg class="icon-eye-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                                <path d="m2 2 20 20"/>
                            </svg>
                        </button>
                    </div>
                    <span class="caps-warn" id="caps-warn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 19V5"/>
                            <path d="m5 12 7-7 7 7"/>
                        </svg>
                        Caps Lock aktif
                    </span>
                </div>

                <div class="form-row">
                    <label class="check">
                        <input type="hidden" name="remember" value="0">
                        <input
                            type="checkbox"
                            name="remember"
                            value="1"
                            <?= old('remember', '1') === '0' ? '' : 'checked' ?>
                        >
                        Ingat saya
                    </label>
                </div>

                <button type="submit" class="btn btn-primary btn-block" id="tombol-masuk">
                    Masuk
                </button>
            </form>

            <div class="auth-help">
                <b>Butuh bantuan masuk?</b>
                <span><?= esc($bantuan) ?></span>
            </div>

            <div class="brand-foot">v1.0 — © 2026 Optik Mekar Jaya</div>
        </section>

    </div>
</div>

<script>
    (function () {
        var password = document.getElementById('password');
        var toggle = document.getElementById('toggle-password');
        var capsWarn = document.getElementById('caps-warn');

        if (password && toggle) {
            toggle.addEventListener('click', function () {
                var tampil = password.type === 'password';

                password.type = tampil ? 'text' : 'password';
                toggle.classList.toggle('is-visible', tampil);
                toggle.setAttribute('aria-label', tampil ? 'Sembunyikan password' : 'Tampilkan password');
                password.focus();
            });
        }

        if (password && capsWarn) {
            var cekCaps = function (event) {
                if (typeof event.getModifierState === 'function') {
                    capsWarn.classList.toggle('is-on', event.getModifierState('CapsLock'));
                }
            };

            password.addEventListener('keydown', cekCaps);
            password.addEventListener('keyup', cekCaps);
            password.addEventListener('blur', function () {
                capsWarn.classList.remove('is-on');
            });
        }

        var form = document.getElementById('form-login');
        var tombol = document.getElementById('tombol-masuk');

        if (form && tombol) {
            form.addEventListener('submit', function () {
                tombol.disabled = true;
                tombol.innerHTML = '<span class="spinner"></span>Memproses...';
            });
        }
    })();
</script>

<?= $this->endSection() ?>
