<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Enums\Role;
use App\Models\UserModel;

class AuthApi extends BaseController
{
    /**
     * @return array{id: int, name: string, username: string, role: string, branchId: int|null}
     */
    private function publicUser(array $user, Role $role): array
    {
        return [
            'id'       => (int) $user['id'],
            'name'     => (string) $user['nama'],
            'username' => (string) $user['username'],
            'role'     => $role->value,
            'branchId' => $user['cabang_id'] !== null
                ? (int) $user['cabang_id']
                : null,
        ];
    }

    /**
     * Respons error JSON yang konsisten sekaligus mengirim token CSRF
     * terbaru. Token CSRF berubah setiap kali request POST berhasil
     * diverifikasi, sehingga frontend butuh nilai terbaru untuk request
     * berikutnya.
     */
    private function jsonError(int $statusCode, string $message)
    {
        return $this->response
            ->setStatusCode($statusCode)
            ->setJSON([
                'success'   => false,
                'message'   => $message,
                'csrfToken' => service('security')->getHash(),
            ]);
    }

    /**
     * POST /api/login
     */
    public function login()
    {
        $data = $this->request->getJSON(true);

        if (! is_array($data)) {
            $data = $this->request->getPost();
        }

        $username = trim((string) ($data['username'] ?? ''));

        $password = (string) ($data['password'] ?? '');

        if ($username === '' || $password === '') {
            return $this->jsonError(400, 'Username dan password wajib diisi.');
        }

        $userModel = new UserModel();

        $user = $userModel
            ->where('username', $username)
            ->first();

        if (! $user || $user['status'] !== 'aktif') {
            return $this->jsonError(401, 'Username atau password salah, atau akun tidak aktif.');
        }

        $storedPassword = (string) $user['password'];

        $passwordValid = password_verify(
            $password,
            $storedPassword
        );

        // Dukungan password lama yang masih plaintext.
        if (! $passwordValid && hash_equals($storedPassword, $password)) {
            $passwordValid = true;

            $userModel->update($user['id'], [
                'password' => $password,
            ]);
        }

        if (! $passwordValid) {
            return $this->jsonError(401, 'Username atau password salah.');
        }

        $role = Role::tryFrom((string) $user['role']);

        if ($role === null) {
            return $this->jsonError(403, 'Peran akun tidak valid.');
        }

        if ($role->requiresCabang() && empty($user['cabang_id'])) {
            return $this->jsonError(403, 'Akun belum terhubung dengan cabang.');
        }

        session()->regenerate(true);

        session()->set([
            'user_id'    => (int) $user['id'],
            'nama'       => $user['nama'],
            'username'   => $user['username'],
            'role'       => $role->value,
            'cabang_id'  => $user['cabang_id'],
            'isLoggedIn' => true,
        ]);

        return $this->response->setJSON([
            'success'   => true,
            'message'   => 'Login berhasil.',
            'user'      => $this->publicUser($user, $role),
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    /**
     * GET /api/me
     */
    public function me()
    {
        if (! session()->get('isLoggedIn')) {
            return $this->jsonError(401, 'Belum login.');
        }

        $userModel = new UserModel();
        $user = $userModel->find(session()->get('user_id'));

        $role = $user ? Role::tryFrom((string) $user['role']) : null;

        if (
            ! $user
            || $user['status'] !== 'aktif'
            || $role === null
            || ($role->requiresCabang() && empty($user['cabang_id']))
        ) {
            session()->destroy();

            return $this->jsonError(401, 'Sesi tidak valid atau akun tidak aktif.');
        }

        return $this->response->setJSON([
            'success'   => true,
            'user'      => $this->publicUser($user, $role),
            'csrfToken' => service('security')->getHash(),
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout()
    {
        session()->destroy();

        return $this->response->setJSON([
            'success'   => true,
            'message'   => 'Logout berhasil.',
            'csrfToken' => service('security')->getHash(),
        ]);
    }
}
