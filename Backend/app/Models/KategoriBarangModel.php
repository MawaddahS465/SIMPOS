<?php

namespace App\Models;

use CodeIgniter\Model;

class KategoriBarangModel extends Model
{
    protected $table         = 'kategori_barang';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'kode_kategori',
        'nama_kategori',
        'keterangan',
        'status',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'kode_kategori' => 'required|max_length[20]|is_unique[kategori_barang.kode_kategori]',
        'nama_kategori' => 'required|max_length[100]',
        'status'        => 'required|in_list[aktif,nonaktif]',
    ];

    protected $validationMessages = [
        'kode_kategori' => [
            'required'   => 'Kode kategori wajib diisi.',
            'max_length' => 'Kode kategori maksimal 20 karakter.',
            'is_unique'  => 'Kode kategori sudah dipakai.',
        ],
        'nama_kategori' => [
            'required'   => 'Nama kategori wajib diisi.',
            'max_length' => 'Nama kategori maksimal 100 karakter.',
        ],
        'status' => [
            'required' => 'Status wajib dipilih.',
            'in_list'  => 'Status harus aktif atau nonaktif.',
        ],
    ];
}
