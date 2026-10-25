<?php

namespace App\Controllers;

use App\Enums\Role;
use App\Models\UserModel;

class Auth extends BaseController
{
    public function login()
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to($this->tujuanSetelahLogin((string) session()->get('role')));
        }

        return view('auth/login', [
            'judul'             => 'Masuk ke SIMPOS',
            'judulMasuk'        => 'Selamat Datang',
            'subJudul'          => 'Silakan masuk untuk mengakses sistem kasir Optik Mekar Jaya.',
            'bantuan'           => 'Hubungi admin di cabang atau tim IT.',
            'usernameTersimpan' => (string) ($this->request->getCookie('simpos_username') ?? ''),
            'pesanError'        => session()->getFlashdata('error'),
            'pesanSukses'       => session()->getFlashdata('success'),
        ]);
    }

    public function prosesLogin()
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to($this->tujuanSetelahLogin((string) session()->get('role')));
        }

        $username = trim((string) $this->request->getPost('username'));
        $password = (string) $this->request->getPost('password');

        if ($username === '' || $password === '') {
            return redirect()->to('/login')
                ->withInput()
                ->with('error', 'Username dan password wajib diisi.');
        }

        $userModel = new UserModel();

        $user = $userModel
            ->where('username', $username)
            ->first();

        if (! $user || $user['status'] !== 'aktif') {
            return redirect()->to('/login')
                ->withInput()
                ->with('error', 'Username atau password salah, atau akun tidak aktif.');
        }

        $storedPassword = (string) $user['password'];
        $passwordValid  = password_verify($password, $storedPassword);

        if (! $passwordValid && hash_equals($storedPassword, $password)) {
            $passwordValid = true;

            // Password lama masih plaintext: simpan ulang lewat model
            // agar otomatis di-hash oleh UserModel::hashPassword().
            $userModel->update($user['id'], [
                'password' => $password,
            ]);
        }

        if (! $passwordValid) {
            return redirect()->to('/login')
                ->withInput()
                ->with('error', 'Username atau password salah.');
        }

        $role = Role::tryFrom((string) $user['role']);

        if ($role === null) {
            return redirect()->to('/login')
                ->withInput()
                ->with('error', 'Peran akun tidak valid.');
        }

        if ($role->requiresCabang() && empty($user['cabang_id'])) {
            return redirect()->to('/login')
                ->withInput()
                ->with('error', 'Akun belum terhubung dengan cabang.');
        }

        session()->regenerate(true);

        session()->set([
            'user_id'    => $user['id'],
            'nama'       => $user['nama'],
            'username'   => $user['username'],
            'role'       => $role->value,
            'cabang_id'  => $user['cabang_id'],
            'isLoggedIn' => true,
        ]);

        $redirect = redirect()->to($this->tujuanSetelahLogin($role->value));

        if ($this->request->getPost('remember') === '1') {
            $redirect->setCookie([
                'name'     => 'simpos_username',
                'value'    => $user['username'],
                'expire'   => 30 * DAY,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        } else {
            $redirect->deleteCookie('simpos_username');
        }

        return $redirect;
    }

    /**
     * Halaman tujuan setelah login, mengikuti peran akun.
     */
    private function tujuanSetelahLogin(string $role): string
    {
        return $role === Role::Kasir->value ? '/kasir/dashboard' : '/dashboard';
    }

    public function logout()
    {
        $session = session();

        $session->remove([
            'user_id',
            'nama',
            'username',
            'role',
            'cabang_id',
            'isLoggedIn',
        ]);

        $session->regenerate(true);
        $session->setFlashdata('success', 'Kamu berhasil logout.');

        return redirect()->to('/login');
    }
}
