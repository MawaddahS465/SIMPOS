<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Enums\Role;
use App\Libraries\SessionAuthenticator;
use App\Models\UserModel;
use CodeIgniter\HTTP\Exceptions\HTTPException;

class AuthApi extends BaseController
{
    /**
     * @return array{id: int, name: string, username: string, email: string, phone: string, role: string, branchId: int|null, branchName: string|null}
     */
    private function publicUser(array $user, Role $role): array
    {
        $branchId = $user['cabang_id'] !== null ? (int) $user['cabang_id'] : null;
        $branchName = null;

        if ($branchId !== null) {
            $branch = db_connect()->table('cabang')
                ->select('nama_cabang')
                ->where('id', $branchId)
                ->get()
                ->getRowArray();
            $branchName = isset($branch['nama_cabang']) ? (string) $branch['nama_cabang'] : null;
        }

        return [
            'id'       => (int) $user['id'],
            'name'     => (string) $user['nama'],
            'username' => (string) $user['username'],
            'email'    => (string) ($user['email'] ?? ''),
            'phone'    => (string) ($user['phone'] ?? ''),
            'role'     => $role->value,
            'branchId' => $branchId,
            'branchName' => $branchName,
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
        // Body JSON rusak bukan alasan untuk 500: perlakukan sebagai input
        // tidak valid supaya klien mendapat pesan yang bisa ditindaklanjuti.
        try {
            $data = $this->request->getJSON(true);
        } catch (HTTPException) {
            $data = null;
        }

        if (! is_array($data)) {
            $data = $this->request->getPost();
        }

        if (
            ! is_array($data)
            || ! is_string($data['username'] ?? null)
            || ! is_string($data['password'] ?? null)
        ) {
            return $this->jsonError(400, 'Username dan password wajib diisi.');
        }

        $username = trim($data['username']);
        $password = $data['password'];

        if ($username === '' || $password === '') {
            return $this->jsonError(400, 'Username dan password wajib diisi.');
        }

        // Batasi percobaan login: maksimal 5 kali per menit untuk kombinasi
        // IP + username. Mencegah brute force tanpa mengunci akun selamanya.
        $throttleKey = 'login_' . md5($this->request->getIPAddress() . '|' . strtolower($username));
        $throttler   = service('throttler');

        if (! $throttler->check($throttleKey, 5, MINUTE)) {
            return $this->jsonError(
                429,
                'Terlalu banyak percobaan login. Coba lagi dalam satu menit.',
            )->setHeader('Retry-After', '60');
        }

        $userModel = new UserModel();

        $user = $userModel
            ->where('username', $username)
            ->first();

        if (! $user || $user['status'] !== 'aktif') {
            return $this->jsonError(401, 'Username atau password salah.');
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

        // Cap waktu login & aktivitas: dasar pemeriksaan idle/absolute timeout.
        (new SessionAuthenticator())->markLogin();

        // Login berhasil: percobaan gagal sebelumnya tidak perlu dihitung lagi.
        $throttler->remove($throttleKey);

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
        $authenticated = (new SessionAuthenticator())->current();

        if ($authenticated === null) {
            return $this->jsonError(401, 'Sesi tidak valid atau akun tidak aktif.');
        }

        return $this->response->setJSON([
            'success'   => true,
            'user'      => $this->publicUser($authenticated['user'], $authenticated['role']),
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
