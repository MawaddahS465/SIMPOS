<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDefaultCabangData extends Migration
{
    public function up()
    {
        $data = [
            [
                'kode_cabang' => 'CB001',
                'nama_cabang' => 'Pasar Raya 1',
                'alamat'      => 'Pasar Raya',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
            [
                'kode_cabang' => 'CB002',
                'nama_cabang' => 'Pasar Raya 2',
                'alamat'      => 'Pasar Raya',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
            [
                'kode_cabang' => 'CB003',
                'nama_cabang' => 'Pasar Raya 3',
                'alamat'      => 'Pasar Raya',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
            [
                'kode_cabang' => 'CB004',
                'nama_cabang' => 'Pasar Raya 4',
                'alamat'      => 'Pasar Raya',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
            [
                'kode_cabang' => 'CB005',
                'nama_cabang' => 'Pasar Raya 5',
                'alamat'      => 'Pasar Raya',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
            [
                'kode_cabang' => 'CB006',
                'nama_cabang' => 'Bandar Buat',
                'alamat'      => 'Bandar Buat',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
            [
                'kode_cabang' => 'CB007',
                'nama_cabang' => 'Payakumbuh',
                'alamat'      => 'Payakumbuh',
                'telepon'     => '',
                'status'      => 'aktif',
            ],
        ];

        $builder = $this->db->table('cabang');

        foreach ($data as $cabang) {
            $exists = $builder->where('kode_cabang', $cabang['kode_cabang'])->countAllResults();
            if ($exists === 0) {
                $builder->insert($cabang);
            }
        }
    }

    public function down()
    {
        $this->db->table('cabang')->whereIn('kode_cabang', ['CB001', 'CB002', 'CB003', 'CB004', 'CB005', 'CB006', 'CB007'])->delete();
    }
}
