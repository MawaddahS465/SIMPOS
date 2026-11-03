<?php

namespace App\Controllers\Kasir;

use App\Models\PembayaranModel;

class Pembayaran extends BaseKasir
{
    public function index()
    {
        // React tidak punya halaman Pembayaran terpisah: /pembayaran dialihkan ke riwayat.
        return redirect()->to('kasir/riwayat');
    }
}
