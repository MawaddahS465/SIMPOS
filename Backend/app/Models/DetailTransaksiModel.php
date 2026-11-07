<?php

namespace App\Models;

use CodeIgniter\Model;

class DetailTransaksiModel extends Model
{
    protected $table         = 'detail_transaksi';
    protected $primaryKey    = 'id_detail_transaksi';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['transaksi_id', 'barang_id', 'jumlah', 'harga', 'subtotal'];
}
