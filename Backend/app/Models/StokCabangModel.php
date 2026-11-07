<?php

namespace App\Models;

use CodeIgniter\Model;

class StokCabangModel extends Model
{
    protected $table         = 'stok_cabang';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['cabang_id', 'barang_id', 'jumlah_stok', 'stok_minimum'];

    public function baris(int $cabangId, int $barangId): ?array
    {
        return $this->where('cabang_id', $cabangId)->where('barang_id', $barangId)->first();
    }
}
