<?php

namespace App\Controllers\Kasir;

use App\Models\PembayaranModel;

class Pembayaran extends BaseKasir
{
    public function index()
    {
        $status = (string) ($this->request->getGet('status') ?? '');
        $cari   = trim((string) ($this->request->getGet('q') ?? ''));
        $metode = (string) ($this->request->getGet('metode') ?? '');

        $semua = (new PembayaranModel())->daftarCabang($this->cabangId());

        $rows = array_values(array_filter($semua, static function (array $p) use ($status, $cari, $metode): bool {
            if ($status !== '' && $p['status'] !== $status) {
                return false;
            }

            if ($metode !== '' && $p['metode_pembayaran'] !== $metode) {
                return false;
            }

            if ($cari !== '') {
                $haystack = mb_strtolower($p['kode_transaksi'] . ' ' . $p['nama_pelanggan'] . ' ' . $p['metode_pembayaran']);

                if (! str_contains($haystack, mb_strtolower($cari))) {
                    return false;
                }
            }

            return true;
        }));

        $diterima = 0.0;
        $pending  = 0.0;
        foreach ($semua as $p) {
            if ($p['status'] === 'lunas' || $p['status'] === 'berhasil') {
                $diterima += (float) $p['jumlah_bayar'];
            } elseif ($p['status'] === 'pending') {
                $pending += (float) $p['jumlah_bayar'];
            }
        }

        $metodeList = array_values(array_unique(array_column($semua, 'metode_pembayaran')));
        sort($metodeList);

        return view('kasir/pembayaran', [
            'judul'      => 'Pembayaran',
            'aktif'      => 'pembayaran',
            'rows'       => $rows,
            'total'      => count($semua),
            'diterima'   => $diterima,
            'pending'    => $pending,
            'status'     => $status,
            'metode'     => $metode,
            'metodeList' => $metodeList,
            'cariQ'      => $cari,
        ]);
    }
}
