<?php

namespace App\Libraries;

use App\Enums\Role;
use App\Models\UserModel;

class SessionAuthenticator
{
    /**
     * Validasi sesi terhadap akun terbaru di database.
     *
     * @return array{user: array<string, mixed>, role: Role}|null
     */
    public function current(): ?array
    {
        if (! session()->get('isLoggedIn')) {
            return null;
        }

        $userId = filter_var(session()->get('user_id'), FILTER_VALIDATE_INT);
        $user   = $userId ? (new UserModel())->find($userId) : null;
        $role   = $user ? Role::tryFrom((string) $user['role']) : null;

        if (
            ! $user
            || $user['status'] !== 'aktif'
            || $role === null
            || ($role->requiresCabang() && empty($user['cabang_id']))
        ) {
            session()->destroy();

            return null;
        }

        session()->set([
            'user_id'   => (int) $user['id'],
            'nama'      => (string) $user['nama'],
            'username'  => (string) $user['username'],
            'role'      => $role->value,
            'cabang_id' => $user['cabang_id'] !== null ? (int) $user['cabang_id'] : null,
        ]);

        return ['user' => $user, 'role' => $role];
    }
}
