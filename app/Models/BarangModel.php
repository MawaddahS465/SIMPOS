<?php

namespace App\Models;

use CodeIgniter\Model;

class BarangModel extends Model
{
    protected $table         = 'barang';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'kategori_id', 'kode_barang', 'nama_barang', 'jenis', 'merek',
        'harga_jual', 'deskripsi', 'status',
    ];

    /**
     * Katalog aktif beserta stok pada satu cabang.
     */
    public function katalogCabang(int $cabangId): array
    {
        return $this->db->table('barang b')
            ->select('b.*, k.nama_kategori, COALESCE(s.jumlah_stok, 0) AS stok, COALESCE(s.stok_minimum, 0) AS stok_minimum')
            ->join('kategori_barang k', 'k.id = b.kategori_id', 'left')
            ->join('stok_cabang s', 's.barang_id = b.id AND s.cabang_id = ' . $cabangId, 'left')
            ->where('b.status', 'aktif')
            ->orderBy('b.jenis', 'ASC')
            ->orderBy('b.nama_barang', 'ASC')
            ->get()
            ->getResultArray();
    }
}
