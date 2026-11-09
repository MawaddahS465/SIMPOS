<?php

namespace App\Libraries;

use App\Enums\Role;
use App\Models\UserModel;

/**
 * Validasi sesi login terhadap database dan batas waktunya.
 *
 * Dipakai oleh AuthFilter (halaman) dan AuthApi::me sehingga aturan kedaluwarsa
 * berlaku sama untuk semua request terautentikasi:
 * - idleTimeout: berakhir bila tidak ada aktivitas selama N detik;
 * - absoluteTimeout: berakhir setelah N detik sejak login, walau aktif.
 *
 * Umur cookie saja tidak cukup: cookie bisa dicuri dan dipakai ulang. Karena
 * itu sesi diputus di server dan ID sesi diganti saat login (session fixation).
 */
class SessionAuthenticator
{
    /**
     * @return array{user: array<string, mixed>, role: Role}|null
     */
    public function current(): ?array
    {
        $session = session();

        if (! $session->get('isLoggedIn')) {
            return null;
        }

        $now = time();

        // Sesi lama (dibuat sebelum penanda waktu ada) diberi cap sekarang
        // agar pengguna tidak dipaksa login ulang setelah pembaruan kode.
        $loginAt = (int) ($session->get('login_at') ?? 0);
        $lastAt  = (int) ($session->get('last_activity') ?? 0);

        $loginAt = $loginAt > 0 ? $loginAt : $now;
        $lastAt  = $lastAt > 0 ? $lastAt : $now;

        if ($this->expired($now, $loginAt, $lastAt)) {
            $this->endSession();

            return null;
        }

        $userId = filter_var($session->get('user_id'), FILTER_VALIDATE_INT);
        $user   = $userId ? (new UserModel())->find($userId) : null;
        $role   = $user ? Role::tryFrom((string) $user['role']) : null;

        if (
            ! $user
            || $user['status'] !== 'aktif'
            || $role === null
            || ($role->requiresCabang() && empty($user['cabang_id']))
        ) {
            $this->endSession();

            return null;
        }

        $session->set([
            'user_id'       => (int) $user['id'],
            'nama'          => (string) $user['nama'],
            'username'      => (string) $user['username'],
            'role'          => $role->value,
            'cabang_id'     => $user['cabang_id'] !== null ? (int) $user['cabang_id'] : null,
            'login_at'      => $loginAt,
            'last_activity' => $now,
        ]);

        return ['user' => $user, 'role' => $role];
    }

    /**
     * Cap waktu login untuk sesi yang baru dibuat.
     *
     * @return int Waktu login (Unix timestamp).
     */
    public function markLogin(): int
    {
        $now = time();

        session()->set([
            'login_at'      => $now,
            'last_activity' => $now,
        ]);

        return $now;
    }

    private function expired(int $now, int $loginAt, int $lastAt): bool
    {
        $config = config('Session');

        $idleTimeout     = (int) ($config->idleTimeout ?? 1800);
        $absoluteTimeout = (int) ($config->absoluteTimeout ?? 28800);

        if ($idleTimeout > 0 && ($now - $lastAt) > $idleTimeout) {
            return true;
        }

        return $absoluteTimeout > 0 && ($now - $loginAt) > $absoluteTimeout;
    }

    /**
     * Hapus data sesi dan cookie sesi di browser. Setelah ini ID sesi lama
     * tidak berlaku lagi, termasuk pada tab lain yang masih terbuka.
     */
    private function endSession(): void
    {
        session()->destroy();
    }
}
