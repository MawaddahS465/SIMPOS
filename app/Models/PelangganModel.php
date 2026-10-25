<?php

namespace App\Models;

use CodeIgniter\Model;

class PelangganModel extends Model
{
    protected $table         = 'pelanggan';
    protected $primaryKey    = 'id_pelanggan';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['nama_pelanggan', 'alamat', 'no_hp'];

    /**
     * Pelanggan + jumlah resep + jumlah PO aktif.
     */
    public function denganRingkasan(): array
    {
        return $this->db->table('pelanggan p')
            ->select('p.*, COUNT(DISTINCT r.id_resep) AS jml_resep, COUNT(DISTINCT po.id_po) AS po_aktif')
            ->join('resep r', 'r.fk_id_pelanggan = p.id_pelanggan', 'left')
            ->join('pemesanan_po po', "po.pelanggan_id = p.id_pelanggan AND po.status IN ('dipesan','diproses','sudah datang')", 'left')
            ->groupBy('p.id_pelanggan')
            ->orderBy('p.nama_pelanggan', 'ASC')
            ->get()
            ->getResultArray();
    }
}
