<?php

namespace App\Models;

use CodeIgniter\Model;

class DetailPoModel extends Model
{
    protected $table         = 'detail_po';
    protected $primaryKey    = 'id_detail_po';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['po_id', 'barang_id', 'jumlah', 'harga', 'subtotal', 'catatan'];
}
