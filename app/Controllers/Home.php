<?php

namespace App\Controllers;

/**
 * Default controller (app/Config/Routing.php).
 * Halaman utama aplikasi adalah login, jadi semua permintaan
 * yang jatuh ke sini langsung dialihkan ke /login.
 */
class Home extends BaseController
{
    public function index()
    {
        return redirect()->to('/login');
    }
}
