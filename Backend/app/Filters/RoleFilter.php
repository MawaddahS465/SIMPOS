<?php

namespace App\Filters;

use App\Enums\Role;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Membatasi akses berdasarkan role yang diberikan sebagai argumen filter.
 *
 * Contoh route: ['filter' => ['auth', 'role:admin,pemilik']]
 */
class RoleFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        $role      = Role::tryFrom((string) session()->get('role'));
        $diizinkan = is_array($arguments) ? $arguments : [];

        if ($role === null || ! in_array($role->value, $diizinkan, true)) {
            return redirect()->to('/dashboard')
                ->with('error', 'Kamu tidak punya akses ke halaman itu.');
        }
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
        // Tidak ada tindakan setelah request.
    }
}
