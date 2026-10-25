<?php

namespace App\Models;

use CodeIgniter\Model;

class TransaksiModel extends Model
{
    protected $table         = 'transaksi';
    protected $primaryKey    = 'id_transaksi';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'kode_transaksi', 'pelanggan_id', 'cabang_id', 'pengguna_id', 'jenis',
        'tanggal_transaksi', 'total', 'diskon', 'pajak', 'status',
    ];

    /**
     * Riwayat transaksi satu cabang beserta nama pelanggan dan metode bayar.
     */
    public function riwayatCabang(int $cabangId, string $status = '', string $cari = ''): array
    {
        $builder = $this->db->table('transaksi t')
            ->select('t.*, p.nama_pelanggan, p.no_hp, pb.metode_pembayaran, pb.jumlah_bayar, pb.status AS status_bayar')
            ->join('pelanggan p', 'p.id_pelanggan = t.pelanggan_id', 'left')
            ->join('pembayaran pb', 'pb.transaksi_id = t.id_transaksi', 'left')
            ->where('t.cabang_id', $cabangId);

        if ($status !== '') {
            $builder->where('t.status', $status);
        }

        if ($cari !== '') {
            $builder->groupStart()
                ->like('t.kode_transaksi', $cari)
                ->orLike('p.nama_pelanggan', $cari)
                ->orLike('p.no_hp', $cari)
                ->groupEnd();
        }

        return $builder->orderBy('t.tanggal_transaksi', 'DESC')->get()->getResultArray();
    }

    public function detail(int $transaksiId): array
    {
        return $this->db->table('detail_transaksi d')
            ->select('d.*, b.nama_barang, b.merek, b.jenis')
            ->join('barang b', 'b.id = d.barang_id')
            ->where('d.transaksi_id', $transaksiId)
            ->get()
            ->getResultArray();
    }
}
