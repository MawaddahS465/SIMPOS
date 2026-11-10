<?php

namespace App\Controllers;

use App\Enums\Role;

class Dashboard extends BaseController
{
    public function index()
    {
        $role = Role::tryFrom((string) session()->get('role'));

        if ($role === null) {
            session()->destroy();

            return redirect()->to('/login');
        }

        if ($role === Role::Kasir) {
            return redirect()->to('kasir/dashboard');
        }

        return view('dashboard/index', [
            'judul' => $role->dashboardTitle(),
            'role'  => $role,
        ]);
    }
}
