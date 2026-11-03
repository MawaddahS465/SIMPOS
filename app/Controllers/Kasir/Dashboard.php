<?php

namespace App\Controllers\Kasir;

class Dashboard extends BaseKasir
{
    public function index()
    {
        $db = db_connect();

        $hariIni = $db->table('transaksi')
            ->where('cabang_id', $this->cabangId())
            ->where('tanggal_transaksi >=', date('Y-m-d 00:00:00'))
            ->where('tanggal_transaksi <=', date('Y-m-d 23:59:59'))
            ->where('status', 'selesai');

        $trxHariIni = (clone $hariIni)->countAllResults();

        $penerimaanHariIni = (float) ($db->table('transaksi')
            ->selectSum('total', 'jumlah')
            ->where('cabang_id', $this->cabangId())
            ->where('tanggal_transaksi >=', date('Y-m-d 00:00:00'))
            ->where('tanggal_transaksi <=', date('Y-m-d 23:59:59'))
            ->where('status', 'selesai')
            ->get()
            ->getRow('jumlah') ?? 0);

        $poSiapDiambil = $db->table('pemesanan_po')
            ->where('cabang_id', $this->cabangId())
            ->where('status', 'sudah_datang')
            ->countAllResults();

        return view('kasir/dashboard', [
            'judul'             => 'Dashboard Kasir',
            'aktif'             => 'dashboard',
            'cari'              => true,
            'trxHariIni'        => $trxHariIni,
            'penerimaanHariIni' => $penerimaanHariIni,
            'poSiapDiambil'     => $poSiapDiambil,
            'tanggalHariIni'    => date('d M Y'),
        ]);
    }
}
