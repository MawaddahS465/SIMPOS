<?php

namespace App\Models;

use CodeIgniter\Model;

class PembayaranModel extends Model
{
    protected $table         = 'pembayaran';
    protected $primaryKey    = 'id_pembayaran';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'transaksi_id', 'tanggal_pembayaran', 'metode_pembayaran',
        'jumlah_bayar', 'referensi', 'status',
    ];

    public function daftarCabang(int $cabangId): array
    {
        return $this->db->table('pembayaran pb')
            ->select('pb.*, t.kode_transaksi, t.cabang_id, p.nama_pelanggan')
            ->join('transaksi t', 't.id_transaksi = pb.transaksi_id')
            ->join('pelanggan p', 'p.id_pelanggan = t.pelanggan_id', 'left')
            ->where('t.cabang_id', $cabangId)
            ->orderBy('pb.tanggal_pembayaran', 'DESC')
            ->get()
            ->getResultArray();
    }
}
