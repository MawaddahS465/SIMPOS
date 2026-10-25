<?php

namespace App\Controllers\Kasir;

class Dashboard extends BaseKasir
{
    public function index()
    {
        $trxHariIni = db_connect()->table('transaksi')
            ->where('cabang_id', $this->cabangId())
            ->where('tanggal_transaksi >=', date('Y-m-d 00:00:00'))
            ->where('tanggal_transaksi <=', date('Y-m-d 23:59:59'))
            ->where('status', 'selesai')
            ->countAllResults();

        return view('kasir/dashboard', [
            'judul'     => 'Dashboard Kasir',
            'aktif'     => 'dashboard',
            'cari'      => true,
            'trxHariIni' => $trxHariIni,
        ]);
    }
}
